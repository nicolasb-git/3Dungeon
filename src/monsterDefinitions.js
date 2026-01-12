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
        texturePaths: {
            idle: '/monster.png',
            attack: '/monster_attack.png'
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
        texturePaths: {
            idle: '/skeleton.png',
            attack: '/skeleton_attack.png'
        }
    },
    knight_skeleton: {
        id: 'knight_skeleton',
        name: "Skeletal Knight",
        hp: 80,
        def: 10,
        attackDamage: { min: 12, max: 18 },
        maxAttackCooldown: 1.8,
        walkingSpeed: 0.6,
        startLevel: 4,
        spawnWeight: 3,
        texturePaths: {
            idle: '/knight_skeleton.png',
            attack: '/knight_skeleton_attack.png'
        }
    }
};
