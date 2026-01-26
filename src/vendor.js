import { ITEMS } from './itemDefinitions.js';
import { createItem } from './item.js';

export function setupVendor(player, currentLevel, addLog, updateHUD) {
    const teleportBtn = document.getElementById('teleport-btn');
    const vendorOverlay = document.getElementById('vendor-overlay');
    const closeVendorBtn = document.getElementById('close-vendor');
    const shopListEl = document.getElementById('shop-list');
    const sellListEl = document.getElementById('sell-list');

    function renderVendorInventories() {
        if (!shopListEl || !sellListEl) return;
        shopListEl.innerHTML = '';
        sellListEl.innerHTML = '';

        const vendorGoldVal = document.getElementById('vendor-gold-val');
        if (vendorGoldVal) {
            vendorGoldVal.innerText = player.gold;
        }

        Object.values(ITEMS).forEach(item => {
            if (item.id.startsWith('heavy_') && currentLevel.value < 12) return;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'vendor-item';
            const cost = player.isGodMode ? 0 : item.price;
            itemDiv.innerHTML = `
                <img src="${item.icon}" alt="${item.name}">
                <div class="item-name">${item.name}</div>
                <div class="item-price">${cost} G ${player.isGodMode ? '(FREE)' : ''}</div>
            `;
            itemDiv.onclick = (event) => {
                event.stopPropagation();
                if (player.gold >= cost) {
                    const newItem = createItem(item);
                    if (newItem && player.addItem(newItem)) {
                        player.gold -= cost;
                        player._hideTooltip();
                        updateHUD();
                        renderVendorInventories();
                        addLog(`Bought ${item.name} for ${cost} gold${player.isGodMode ? ' (Cheater!)' : ''}.`);
                    } else if (!newItem) {
                        addLog("Error creating item!");
                    } else {
                        addLog("Backpack is full!");
                    }
                } else {
                    addLog("Not enough gold!");
                }
            };
            itemDiv.onmousedown = (e) => e.stopPropagation();
            itemDiv.onmouseenter = () => player._showTooltip(item);
            itemDiv.onmouseleave = () => player._hideTooltip();
            shopListEl.appendChild(itemDiv);
        });

        player.inventory.forEach((item, index) => {
            if (!item) return;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'vendor-item';
            const sellPrice = Math.floor(item.price * 0.5);
            itemDiv.innerHTML = `
                <img src="${item.icon}" alt="${item.name}">
                <div class="item-name">${item.name}</div>
                <div class="item-price">${sellPrice} G</div>
            `;
            itemDiv.onclick = (event) => {
                event.stopPropagation();
                player.gold += sellPrice;
                player.inventory.splice(index, 1);
                player._hideTooltip();
                updateHUD();
                renderVendorInventories();
                addLog(`Sold ${item.name} for ${sellPrice} gold.`);
            };
            itemDiv.onmousedown = (e) => e.stopPropagation();
            itemDiv.onmouseenter = () => player._showTooltip(item);
            itemDiv.onmouseleave = () => player._hideTooltip();
            sellListEl.appendChild(itemDiv);
        });
    }

    function openVendor() {
        if (player.hp <= 0) return;
        if (vendorOverlay) vendorOverlay.style.display = 'flex';
        player.controls.unlock();
        renderVendorInventories();
        addLog("You teleport to the Sly Vendor...");
    }

    function closeVendor() {
        if (vendorOverlay) vendorOverlay.style.display = 'none';
        player._hideTooltip();
        addLog("Returning to the dungeon...");
    }

    if (teleportBtn) {
        teleportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openVendor();
        });
    }

    if (closeVendorBtn) {
        closeVendorBtn.addEventListener('click', closeVendor);
        closeVendorBtn.onmousedown = (e) => e.stopPropagation();
    }

    return { openVendor, closeVendor };
}
