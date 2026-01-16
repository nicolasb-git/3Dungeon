import { Item } from './item.js';

export class Weapon extends Item {
    constructor(name, minDamage, maxDamage, cooldown, icon = '/sword_icon.png', price = 0) {
        super(name, 'weapon', icon, price);
        this.minDamage = minDamage;
        this.maxDamage = maxDamage;
        this.cooldown = cooldown;
        this.itemClass = 'Weapon';
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
