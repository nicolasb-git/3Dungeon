import * as THREE from 'three';
import { Monster } from './monster.js';
import { MONSTERS } from './monsterDefinitions.js';
import { LOOT_CONFIG } from './lootConfig.js';
import { Loot } from './loot.js';
import { STATUSES } from './statusDefinitions.js';

export function spawnMonsters(scene, dungeon, levelIndex, monstersArray, addLog) {
    const bossSpawn = dungeon.getBossSpawnPoint();
    const startPos = dungeon.getStartPosition();

    if (!bossSpawn) {
        const numMonsters = 1 + levelIndex;
        const emptySpaces = dungeon.getEmptySpaces();
        const validSpaces = emptySpaces.filter(s => {
            const dist = Math.sqrt(Math.pow(s.x - startPos.x, 2) + Math.pow(s.z - startPos.z, 2));
            return dist >= 3;
        });

        for (let i = 0; i < numMonsters && validSpaces.length > 0; i++) {
            const rndIdx = Math.floor(Math.random() * validSpaces.length);
            const spot = validSpaces.splice(rndIdx, 1)[0];
            const monsterPos = new THREE.Vector3(spot.x, 0, spot.z);

            const available = Object.entries(MONSTERS)
                .filter(([_, config]) => levelIndex >= (config.startLevel || 1) && (config.spawnWeight !== 0))
                .map(([id, config]) => ({ id, weight: config.spawnWeight ?? 1 }));

            const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
            let random = Math.random() * totalWeight;
            let type = available[0].id;

            for (const item of available) {
                if (random < item.weight) {
                    type = item.id;
                    break;
                }
                random -= item.weight;
            }

            if (type === 'knight_skeleton') addLog(`A powerful presence emerges... a Skeletal Knight!`);
            else if (type === 'cultist') addLog(`A dark ritual is whispered... a Dark Cultist enters!`);

            const monster = new Monster(scene, monsterPos, type);
            monster.maxHp += (levelIndex - 1) * 20;
            monster.hp = monster.maxHp;
            monster.attackDamage.min += (levelIndex - 1) * 2;
            monster.attackDamage.max += (levelIndex - 1) * 3;
            monstersArray.push(monster);
        }
    } else if (levelIndex === 11) {
        const boss = new Monster(scene, bossSpawn, 'skeletal_boss');
        monstersArray.push(boss);
        addLog("A TERRIFYING presence fills the air... The Lord of Rattles has appeared!");
    }

    if (monstersArray.length > 0) {
        addLog(`${monstersArray.length} shadows move in the distance...`);
    }
}

export function handleMonsterBehavior(delta, monsters, player, camera, dungeon, addLog, triggerBloodFlash, showDamageNumber) {
    monsters.forEach(m => {
        m.update(delta);
        const playerPos = camera.position;
        const monsterPos = m.sprite ? m.sprite.position : null;

        if (monsterPos) {
            const dist = playerPos.distanceTo(monsterPos);

            if (!m.spottedPlayer && m.hasLineOfSight(playerPos, dungeon.getWalls()) && dist < 10) {
                m.spottedPlayer = true;
                addLog(`The ${m.name} has spotted you!`);
            }

            if (m.spottedPlayer) {
                if (m.isBoss && m.triggerPowerfulAttack) {
                    m.triggerPowerfulAttack = false;
                    if (dist < 1.5) {
                        const powerDamage = Math.floor(m.getAttackDamage() * 2.5);
                        const result = player.takeDamage(powerDamage);
                        player._playScratchSound();
                        triggerBloodFlash();
                        showDamageNumber(null, camera, result.actualDamage, 'player-heavy');
                        addLog(`CRITICAL HIT! The ${m.name} smashes you for ${result.actualDamage} damage!`);
                    } else {
                        addLog(`You narrowly avoided the ${m.name}'s powerful blow!`);
                    }
                    m.attackCooldown = m.maxAttackCooldown;
                    m.playAttackAnimation();
                }

                if (m.preparingPowerfulAttack) return;

                if (dist < 1.0) {
                    if (m.attackCooldown <= 0) {
                        if (m.isBoss && Math.random() < 0.2) {
                            m.startPowerfulAttack();
                            addLog(`${m.name} is preparing a DEVASTATING attack! BACK AWAY!`);
                        } else {
                            const baseDamage = m.getAttackDamage();
                            const result = player.takeDamage(baseDamage);
                            player._playScratchSound();
                            triggerBloodFlash();
                            showDamageNumber(null, camera, result.actualDamage, 'player');
                            m.playAttackAnimation();
                            addLog(`The ${m.name} hits you for ${result.actualDamage} damage (${result.baseDamage} - ${result.def} DEF)!`);

                            const monsterConfig = MONSTERS[m.type];
                            if (monsterConfig?.plagueChance && Math.random() < monsterConfig.plagueChance) {
                                player.applyStatus(STATUSES.plague);
                                addLog("You have been infected with the Plague!");
                            }
                            if (monsterConfig?.poisonChance && Math.random() < monsterConfig.poisonChance) {
                                player.applyStatus(STATUSES.poison);
                                addLog("You have been poisoned!");
                            }
                            m.attackCooldown = m.maxAttackCooldown;
                        }
                    }
                } else {
                    m.moveTowards(camera.position, delta, dungeon.getWalls());
                }
            }
        }
    });
}

export function cleanupMonstersAndDropLoot(monsters, scene, loots, player, addLog, dungeon) {
    for (let i = monsters.length - 1; i >= 0; i--) {
        if (monsters[i].hp <= 0) {
            const pos = monsters[i].sprite.position.clone();
            const lootResults = monsters[i].getLoot();
            lootResults.forEach(lootData => {
                if (lootData.type === 'gold') {
                    loots.push(new Loot(scene, pos, lootData.amount));
                } else if (lootData.type === 'item') {
                    loots.push(new Loot(scene, pos, 0, lootData.item));
                    addLog(`The ${monsters[i].name} dropped a ${lootData.item.name}!`);
                }
            });

            if (player.addXP(monsters[i].isBoss ? 500 : 25)) {
                addLog("LEVEL UP! You feel more powerful!");
            }

            if (monsters[i].isBoss) {
                addLog(`VICTORY! The ${monsters[i].name} has been defeated! The path forward is revealed.`);
                const exitMesh = dungeon.getBossExitMesh();
                if (exitMesh) exitMesh.visible = true;
            }

            monsters[i].remove();
            monsters.splice(i, 1);
        }
    }
}

export function handleLootCollection(loots, player, camera, addLog, lastInvFullMsgTimeRef) {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        camera.position,
        new THREE.Vector3(0.5, 1.8, 0.5)
    );

    for (let i = loots.length - 1; i >= 0; i--) {
        if (playerBox.intersectsBox(loots[i].getBoundingBox())) {
            if (loots[i].item) {
                if (player.inventory.length >= player.maxInventory) {
                    const now = Date.now();
                    if (now - lastInvFullMsgTimeRef.value > 3000) {
                        addLog("Your backpack is full! Free some space to pick up the item.");
                        lastInvFullMsgTimeRef.value = now;
                    }
                } else {
                    const itemToPick = loots[i].item;
                    if (player.addItem(itemToPick)) {
                        player._hideTooltip();
                        addLog(`You picked up: ${itemToPick.name}`);
                        loots[i].remove();
                        loots.splice(i, 1);
                    }
                }
            } else {
                const amount = loots[i].amount;
                player.addGold(amount);
                addLog(`You picked up ${amount} gold coins!`);
                loots[i].remove();
                loots.splice(i, 1);
            }
        }
    }
}
