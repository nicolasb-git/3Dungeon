import { MONSTERS } from './monsterDefinitions.js';
import { LOOT_CONFIG } from './lootConfig.js';
import { ITEMS } from './itemDefinitions.js';

async function checkAssetExists(path) {
    try {
        const response = await fetch(path, { method: 'HEAD' });
        return response.ok;
    } catch (e) {
        return false;
    }
}

export async function validateAssets(addLog) {
    console.log("Starting asset and logic validation...");

    const monsterKeys = Object.keys(MONSTERS);
    const missingLoot = monsterKeys.filter(mId => !LOOT_CONFIG[mId]);
    if (missingLoot.length > 0) {
        console.error("CRITICAL: Missing loot definitions for:", missingLoot.join(", "));
        addLog(`WARNING: Loot table missing for: ${missingLoot.join(", ")}`);
    }

    const assetChecks = [];
    monsterKeys.forEach(mId => {
        const m = MONSTERS[mId];
        assetChecks.push({ id: `Monster:${mId}:idle`, path: m.texturePaths.idle });
        assetChecks.push({ id: `Monster:${mId}:attack`, path: m.texturePaths.attack });
    });

    Object.keys(ITEMS).forEach(itemId => {
        const item = ITEMS[itemId];
        assetChecks.push({ id: `Item:${itemId}`, path: item.icon });
    });

    const results = await Promise.all(assetChecks.map(async check => ({
        ...check,
        exists: await checkAssetExists(check.path)
    })));

    const brokenAssets = results.filter(r => !r.exists);
    if (brokenAssets.length > 0) {
        const msg = brokenAssets.map(r => `${r.id} (${r.path})`).join(", ");
        console.error("CRITICAL: Broken asset paths detected:", msg);
        addLog(`WARNING: Some textures are missing: ${brokenAssets.length} broken paths.`);
    } else {
        console.log("All assets and loot definitions validated successfully.");
    }
}
