export const ITEMS = {
    leather_tunic: {
        id: 'leather_tunic',
        name: 'Leather Tunic',
        itemClass: 'Armor',
        itemType: 'torso',
        defense: 5,
        price: 50,
        icon: '/items/tunic_icon.png'
    },
    rusty_chainmail: {
        id: 'rusty_chainmail',
        name: 'Rusty Chainmail',
        itemClass: 'Armor',
        itemType: 'torso',
        defense: 8,
        price: 150,
        icon: '/items/chainmail_icon.png'
    },
    iron_plate: {
        id: 'iron_plate',
        name: 'Iron Plate',
        itemClass: 'Armor',
        itemType: 'torso',
        defense: 12,
        price: 400,
        icon: '/items/iron_plate_icon.png'
    },
    healing_potion: {
        id: 'healing_potion',
        name: 'Healing Potion',
        itemClass: 'Potion',
        type: 'consumable',
        healAmount: 30,
        price: 25,
        icon: '/items/potion_icon.png'
    },
    strength_potion: {
        id: 'strength_potion',
        name: 'Strength Potion',
        itemClass: 'Potion',
        type: 'consumable',
        statusId: 'strength',
        price: 30,
        icon: '/items/strength_potion.png'
    },
    cleanse_potion: {
        id: 'cleanse_potion',
        name: 'Cleanse Potion',
        type: 'consumable',
        itemClass: 'Potion',
        cleanses: true,
        price: 45,
        icon: '/items/cleanse_potion.png'
    },
    basic_sword: {
        id: 'basic_sword',
        name: 'Basic Sword',
        itemClass: 'Weapon',
        minDamage: 2,
        maxDamage: 4,
        cooldown: 0.5,
        price: 100,
        icon: '/items/sword_icon.png'
    },
    superior_sword: {
        id: 'superior_sword',
        name: 'Superior Sword',
        itemClass: 'Weapon',
        minDamage: 6,
        maxDamage: 10,
        cooldown: 0.4,
        price: 800,
        icon: '/items/superior_sword_icon.png'
    },
    basic_shield: {
        id: 'basic_shield',
        name: 'Wooden Shield',
        itemClass: 'Armor',
        itemType: 'l-hand',
        defense: 3,
        price: 75,
        icon: '/items/basic_shield_icon.png'
    },
    iron_shield: {
        id: 'iron_shield',
        name: 'Iron Shield',
        itemClass: 'Armor',
        itemType: 'l-hand',
        defense: 7,
        price: 250,
        icon: '/items/iron_shield_icon.png'
    },
    iron_helmet: {
        id: 'iron_helmet',
        name: 'Iron Helmet',
        itemClass: 'Armor',
        itemType: 'head',
        defense: 4,
        price: 120,
        icon: '/items/iron_helmet_icon.png'
    },
    iron_greaves: {
        id: 'iron_greaves',
        name: 'Iron Greaves',
        itemClass: 'Armor',
        itemType: 'legs',
        defense: 5,
        price: 150,
        icon: '/items/iron_greaves_icon.png'
    },
    leather_shoulder: {
        id: 'leather_shoulder',
        name: 'Leather Shoulder',
        itemClass: 'Armor',
        itemType: 'shoulder',
        defense: 2,
        price: 35,
        icon: '/items/leather_shoulder_icon.png'
    },
    iron_shoulder: {
        id: 'iron_shoulder',
        name: 'Iron Shoulder',
        itemClass: 'Armor',
        itemType: 'shoulder',
        defense: 4,
        price: 160,
        icon: '/items/iron_shoulder_icon.png'
    },
    leather_boots: {
        id: 'leather_boots',
        name: 'Leather Boots',
        itemClass: 'Armor',
        itemType: 'boots',
        defense: 2,
        price: 40,
        icon: '/items/leather_boots_icon.png'
    },
    iron_boots: {
        id: 'iron_boots',
        name: 'Iron Boots',
        itemClass: 'Armor',
        itemType: 'boots',
        defense: 4,
        price: 180,
        icon: '/items/iron_boots_icon.png'
    },
    // HEAVY VARIANTS
    heavy_leather_tunic: {
        id: 'heavy_leather_tunic',
        name: 'Heavy Leather Tunic',
        itemClass: 'Armor',
        itemType: 'torso',
        defense: 9,
        price: 120,
        icon: '/items/heavy_tunic_icon.png'
    },
    heavy_rusty_chainmail: {
        id: 'heavy_rusty_chainmail',
        name: 'Heavy Rusty Chainmail',
        itemClass: 'Armor',
        itemType: 'torso',
        defense: 13,
        price: 300,
        icon: '/items/heavy_chainmail_icon.png'
    },
    heavy_iron_plate: {
        id: 'heavy_iron_plate',
        name: 'Heavy Iron Plate',
        itemClass: 'Armor',
        itemType: 'torso',
        defense: 20,
        price: 900,
        icon: '/items/heavy_iron_plate_icon.png'
    },
    heavy_basic_sword: {
        id: 'heavy_basic_sword',
        name: 'Heavy Basic Sword',
        itemClass: 'Weapon',
        minDamage: 5,
        maxDamage: 8,
        cooldown: 0.5,
        price: 250,
        icon: '/items/heavy_sword_icon.png'
    },
    heavy_superior_sword: {
        id: 'heavy_superior_sword',
        name: 'Heavy Superior Sword',
        itemClass: 'Weapon',
        minDamage: 12,
        maxDamage: 18,
        cooldown: 0.4,
        price: 1800,
        icon: '/items/heavy_superior_sword_icon.png'
    },
    heavy_basic_shield: {
        id: 'heavy_basic_shield',
        name: 'Heavy Wooden Shield',
        itemClass: 'Armor',
        itemType: 'l-hand',
        defense: 6,
        price: 150,
        icon: '/items/heavy_basic_shield_icon.png'
    },
    heavy_iron_shield: {
        id: 'heavy_iron_shield',
        name: 'Heavy Iron Shield',
        itemClass: 'Armor',
        itemType: 'l-hand',
        defense: 12,
        price: 500,
        icon: '/items/heavy_iron_shield_icon.png'
    },
    heavy_iron_helmet: {
        id: 'heavy_iron_helmet',
        name: 'Heavy Iron Helmet',
        itemClass: 'Armor',
        itemType: 'head',
        defense: 8,
        price: 250,
        icon: '/items/heavy_iron_helmet_icon.png'
    },
    heavy_iron_greaves: {
        id: 'heavy_iron_greaves',
        name: 'Heavy Iron Greaves',
        itemClass: 'Armor',
        itemType: 'legs',
        defense: 10,
        price: 350,
        icon: '/items/heavy_iron_greaves_icon.png'
    },
    heavy_leather_shoulder: {
        id: 'heavy_leather_shoulder',
        name: 'Heavy Leather Shoulder',
        itemClass: 'Armor',
        itemType: 'shoulder',
        defense: 5,
        price: 80,
        icon: '/items/heavy_leather_shoulder_icon.png'
    },
    heavy_iron_shoulder: {
        id: 'heavy_iron_shoulder',
        name: 'Heavy Iron Shoulder',
        itemClass: 'Armor',
        itemType: 'shoulder',
        defense: 9,
        price: 350,
        icon: '/items/heavy_iron_shoulder_icon.png'
    },
    heavy_leather_boots: {
        id: 'heavy_leather_boots',
        name: 'Heavy Leather Boots',
        itemClass: 'Armor',
        itemType: 'boots',
        defense: 5,
        price: 90,
        icon: '/items/heavy_leather_boots_icon.png'
    },
    heavy_iron_boots: {
        id: 'heavy_iron_boots',
        name: 'Heavy Iron Boots',
        itemClass: 'Armor',
        itemType: 'boots',
        defense: 9,
        price: 400,
        icon: '/items/heavy_iron_boots_icon.png'
    }
};
