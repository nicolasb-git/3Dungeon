import { Item } from './item.js';

export class Weapon extends Item {
    constructor(name, minDamage, maxDamage, cooldown, iconUrl = '/sword_icon.png') {
        super(name, 'weapon', iconUrl);
        this.minDamage = minDamage;
        this.maxDamage = maxDamage;
        this.cooldown = cooldown;
    }

    getDamage() {
        return Math.floor(Math.random() * (this.maxDamage - this.minDamage + 1)) + this.minDamage;
    }
}

export class BasicSword extends Weapon {
    constructor() {
        super('Basic Sword', 2, 4, 0.5, '/sword_icon.png');
    }
}
