export const MONSTERS = {
    shadow: {
        id: 'shadow',
        name: "Lesser Shadow",
        hp: 40,
        def: 0,
        attackDamage: { min: 4, max: 6 },
        maxAttackCooldown: 0.6,
        speed: 1.0,
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
        speed: 0.8,
        texturePaths: {
            idle: '/skeleton.png',
            attack: '/skeleton_attack.png'
        }
    }
};
