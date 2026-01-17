import { ITEMS } from './itemDefinitions.js';

export const LOOT_CONFIG = {
    shadow: [
        {
            type: 'gold',
            chance: 0.7,
            min: 10,
            max: 20
        },
        {
            type: 'item',
            chance: 0.1,
            item: ITEMS.leather_tunic
        },
        {
            type: 'item',
            chance: 0.15,
            item: ITEMS.healing_potion
        },
        {
            type: 'item',
            chance: 0.05,
            item: ITEMS.basic_shield
        },
        {
            type: 'item',
            chance: 0.05,
            item: ITEMS.strength_potion
        }
    ],
    skeleton: [
        {
            type: 'gold',
            chance: 0.5,
            min: 20,
            max: 40
        },
        {
            type: 'item',
            chance: 0.1,
            item: ITEMS.leather_tunic
        },
        {
            type: 'item',
            chance: 0.2,
            item: ITEMS.rusty_chainmail
        },
        {
            type: 'item',
            chance: 0.25,
            item: ITEMS.healing_potion
        },
        {
            type: 'item',
            chance: 0.10,
            item: ITEMS.basic_sword
        },
        {
            type: 'item',
            chance: 0.05,
            item: ITEMS.superior_sword
        },
        {
            type: 'item',
            chance: 0.1,
            item: ITEMS.basic_shield
        },
        {
            type: 'item',
            chance: 0.05,
            item: ITEMS.iron_shield
        },
        {
            type: 'item',
            chance: 0.05,
            item: ITEMS.iron_helmet
        },
        {
            type: 'item',
            chance: 0.05,
            item: ITEMS.iron_greaves
        },
        {
            type: 'item',
            chance: 0.08,
            item: ITEMS.strength_potion
        }
    ],
    knight_skeleton: [
        {
            type: 'gold',
            chance: 0.8,
            min: 40,
            max: 80
        },
        {
            type: 'item',
            chance: 0.2,
            item: ITEMS.iron_plate
        },
        {
            type: 'item',
            chance: 0.3,
            item: ITEMS.healing_potion
        },
        {
            type: 'item',
            chance: 0.15,
            item: ITEMS.superior_sword
        },
        {
            type: 'item',
            chance: 0.2,
            item: ITEMS.iron_shield
        },
        {
            type: 'item',
            chance: 0.1,
            item: ITEMS.iron_helmet
        },
        {
            type: 'item',
            chance: 0.05,
            item: ITEMS.iron_greaves
        },
        {
            type: 'item',
            chance: 0.15,
            item: ITEMS.strength_potion
        }
    ],
    rat: [
        {
            type: 'gold',
            chance: 0.4,
            min: 5,
            max: 12
        },
        {
            type: 'item',
            chance: 0.05,
            item: ITEMS.healing_potion
        }
    ],
    skeletal_boss: [
        {
            type: 'gold',
            chance: 1.0,
            min: 500,
            max: 1000
        },
        {
            type: 'item',
            chance: 0.5,
            item: ITEMS.superior_sword
        },
        {
            type: 'item',
            chance: 0.4,
            item: ITEMS.iron_plate
        },
        {
            type: 'item',
            chance: 1.0,
            item: ITEMS.healing_potion
        },
        {
            type: 'item',
            chance: 1.0,
            item: ITEMS.strength_potion
        }
    ]
};
