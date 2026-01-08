export class Weapon {
    constructor(name, minDamage, maxDamage, cooldown) {
        this.name = name;
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
        super('Basic Sword', 2, 4, 0.5);
    }
}
