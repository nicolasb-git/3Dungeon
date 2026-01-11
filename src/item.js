export class Item {
    constructor(name, type, iconUrl) {
        this.name = name;
        this.type = type; // 'weapon', 'head', 'torso', 'legs', 'boots', 'ring', etc.
        this.iconUrl = iconUrl;
    }
}

export class Armor extends Item {
    constructor(name, type, defense, iconUrl) {
        super(name, type, iconUrl);
        this.defense = defense;
    }
}
