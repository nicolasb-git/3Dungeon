import { BasicSword } from './weapon.js';

export class BaseClass {
    constructor() {
        this.name = "Base";
        this.hp = 100;
        this.str = 10;
        this.def = 0;
        this.weapon = new BasicSword();
    }
}

export class Warrior extends BaseClass {
    constructor() {
        super();
        this.name = "Warrior";
        this.hp = 120;
        this.str = 15;
        this.def = 0; // Starts with 0 defense without armor
    }
}
