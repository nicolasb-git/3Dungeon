export const STATUSES = {
    plague: {
        id: 'plague',
        name: 'Plague',
        type: 'debuff',
        icon: '/plague_icon.png',
        duration: 120,
        tickInterval: 10,
        description: (player) => `Loses 2% current HP every 10s.`,
        onTick: (player, logger) => {
            if (player.isGodMode) return; // Immune to plague in God Mode

            const damage = Math.ceil(player.hp * 0.02);
            player.hp = Math.max(0, player.hp - damage);
            player.updateUI();
            if (logger) {
                logger(`The plague wracks your body... (-${damage} HP)`);
                if (player.hp <= 0) {
                    logger("You have succumbed to the plague.");
                }
            }
        }
    },
    poison: {
        id: 'poison',
        name: 'Poison',
        type: 'debuff',
        icon: '/poison_icon.png',
        duration: 60,
        tickInterval: 5,
        description: (player) => `Loses 3% HP every 5s.`,
        onTick: (player, logger) => {
            if (player.isGodMode) return;
            const damage = Math.ceil(player.maxHp * 0.03);
            player.hp = Math.max(0, player.hp - damage);
            player.updateUI();
            if (logger) {
                logger(`The poison burns in your veins... (-${damage} HP)`);
                if (player.hp <= 0) {
                    logger("The poison was too strong.");
                }
            }
        }
    },
    // Example of a buff we could add later
    strength: {
        id: 'strength',
        name: 'Strength Boost',
        type: 'buff',
        icon: '/strength_potion.png', // Updated icon
        duration: 60,
        description: (player) => `+5 STR for 60s`,
        onApply: (player, logger) => {
            player.str += 5;
            player.updateUI();
            if (logger) logger("You feel a surge of strength!");
        },
        onRemove: (player, logger) => {
            player.str -= 5;
            player.updateUI();
            if (logger) logger("The surge of strength fades...");
        }
    }
};
