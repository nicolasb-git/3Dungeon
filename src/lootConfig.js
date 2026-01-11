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
        }
    ]
};
