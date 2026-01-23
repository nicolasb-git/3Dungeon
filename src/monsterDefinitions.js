export const MONSTERS = {
    shadow: {
        id: 'shadow',
        name: "Lesser Shadow",
        hp: 40,
        def: 0,
        attackDamage: { min: 4, max: 6 },
        maxAttackCooldown: 0.6,
        walkingSpeed: 1.0,
        startLevel: 1,
        spawnWeight: 10,
        scale: 0.8,
        texturePaths: {
            idle: '/monsters/monster.png',
            attack: '/monsters/monster_attack.png'
        }
    },
    skeleton: {
        id: 'skeleton',
        name: "Rattled Skeleton",
        hp: 20,
        def: 4,
        attackDamage: { min: 5, max: 8 },
        maxAttackCooldown: 1.0,
        walkingSpeed: 0.8,
        startLevel: 2,
        spawnWeight: 5,
        scale: 0.8,
        texturePaths: {
            idle: '/monsters/skeleton.png',
            attack: '/monsters/skeleton_attack.png'
        }
    },
    knight_skeleton: {
        id: 'knight_skeleton',
        name: "Skeletal Knight",
        hp: 80,
        def: 10,
        attackDamage: { min: 8, max: 12 },
        maxAttackCooldown: 1.8,
        walkingSpeed: 0.6,
        startLevel: 4,
        spawnWeight: 4, // Slightly increased weight
        scale: 0.85,
        texturePaths: {
            idle: '/monsters/knight_skeleton.png',
            attack: '/monsters/knight_skeleton_attack.png'
        }
    },
    rat: {
        id: 'rat',
        name: "Plague Rat",
        hp: 15,
        def: 0,
        attackDamage: { min: 3, max: 5 },
        maxAttackCooldown: 0.6,
        walkingSpeed: 1.8,
        startLevel: 1,
        spawnWeight: 12,
        scale: 0.4,
        plagueChance: 0.1,
        texturePaths: {
            idle: '/monsters/rat.png',
            attack: '/monsters/rat_attack.png'
        }
    },
    skeletal_boss: {
        id: 'skeletal_boss',
        name: "Lord of Rattles",
        hp: 300,
        def: 15,
        attackDamage: { min: 10, max: 15 },
        maxAttackCooldown: 2.0,
        walkingSpeed: 0.5,
        startLevel: 11,
        spawnWeight: 0, // Manual spawn only
        scale: 1.5,
        isBoss: true,
        texturePaths: {
            idle: '/monsters/lord_rattles_idle.png',
            attack: '/monsters/lord_rattles_attack.png'
        }
    },
    snake: {
        id: 'snake',
        name: "Emerald Seraph",
        hp: 25,
        def: 0,
        attackDamage: { min: 4, max: 7 },
        maxAttackCooldown: 0.5,
        walkingSpeed: 2.2,
        startLevel: 12,
        spawnWeight: 15,
        scale: 0.5,
        poisonChance: 0.2,
        texturePaths: {
            idle: '/monsters/snake_idle.png',
            attack: '/monsters/snake_attack.png'
        }
    },
    zombie: {
        id: 'zombie',
        name: "Restless Shambler",
        hp: 120,
        def: 5,
        attackDamage: { min: 12, max: 18 },
        maxAttackCooldown: 2.5,
        walkingSpeed: 0.4,
        startLevel: 12,
        spawnWeight: 8,
        scale: 0.9,
        texturePaths: {
            idle: '/monsters/zombie_idle.png',
            attack: '/monsters/zombie_attack.png'
        }
    },
    cultist: {
        id: 'cultist',
        name: "Dark Cultist",
        hp: 60,
        def: 2,
        attackDamage: { min: 15, max: 22 },
        maxAttackCooldown: 1.2,
        walkingSpeed: 1.0,
        startLevel: 12,
        spawnWeight: 10,
        scale: 0.8,
        texturePaths: {
            idle: '/monsters/cultist_idle.png',
            attack: '/monsters/cultist_attack.png'
        }
    }
};
