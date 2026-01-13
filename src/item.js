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
    }
}

export class Potion extends Item {
    constructor(name, healAmount, icon, price = 0) {
        super(name, 'consumable', icon, price);
        this.healAmount = healAmount;
    }
}

import { Weapon } from './weapon.js';

export function createItem(data) {
    if (!data) return null;
    if (data.itemClass === 'Armor') {
        return new Armor(data.name, data.itemType, data.defense, data.icon, data.price);
    } else if (data.itemClass === 'Potion') {
        return new Potion(data.name, data.healAmount, data.icon, data.price);
    } else if (data.itemClass === 'Weapon') {
        return new Weapon(data.name, data.minDamage, data.maxDamage, data.cooldown, data.icon, data.price);
    }
    return null;
}

