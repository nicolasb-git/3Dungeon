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
        this.itemClass = 'Potion';
    }
}

import { Weapon } from './weapon.js';

export function createItem(data) {
    if (!data) return null;
    if (data.itemClass === 'Armor') {
        return new Armor(data.name, data.itemType, data.defense, data.icon, data.price);
    } else if (data.itemClass === 'Potion') {
        const type = data.type || 'consumable';
        return new Potion(data.name, data.icon, data.price, {
            healAmount: data.healAmount,
            statusId: data.statusId
        });
    } else if (data.itemClass === 'Weapon') {
        return new Weapon(data.name, data.minDamage, data.maxDamage, data.cooldown, data.icon, data.price);
    }
    return null;
}

