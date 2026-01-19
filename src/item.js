export class Item {
    constructor(name, type, icon, price = 0) {
        this.name = name;
        this.type = type; // 'weapon', 'head', 'torso', 'legs', 'boots', 'ring', etc.
        this.icon = icon;
        this.price = price;
    }
}

export class Armor extends Item {
    constructor(name, type, defense, icon, price = 0) {
        super(name, type, icon, price);
        this.defense = defense;
        this.itemClass = 'Armor';
    }
}

export class Potion extends Item {
    constructor(name, icon, price = 0, options = {}) {
        super(name, 'consumable', icon, price);
        this.healAmount = options.healAmount || 0;
        this.statusId = options.statusId || null;
        this.cleanses = options.cleanses || false;
        this.itemClass = 'Potion';
    }
}

import { Weapon } from './weapon.js';

export function createItem(data) {
    if (!data) return null;
    let item = null;
    if (data.itemClass === 'Armor') {
        item = new Armor(data.name, data.itemType, data.defense, data.icon, data.price);
    } else if (data.itemClass === 'Potion') {
        const type = data.type || 'consumable';
        item = new Potion(data.name, data.icon, data.price, {
            healAmount: data.healAmount,
            statusId: data.statusId,
            cleanses: data.cleanses
        });
    } else if (data.itemClass === 'Weapon') {
        item = new Weapon(data.name, data.minDamage, data.maxDamage, data.cooldown, data.icon, data.price);
    }

    if (item && data.id) {
        item.itemId = data.id;
    }
    return item;
}

