export function addLog(message) {
    const logEl = document.getElementById('log');
    if (!logEl) return;

    const entry = document.createElement('div');
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logEl.appendChild(entry);

    const container = document.getElementById('log-container');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

export function showDamageNumber(worldPosition, camera, amount, className = '') {
    let x, y;

    if (worldPosition) {
        const vector = worldPosition.clone().project(camera);
        x = (vector.x + 1) / 2 * window.innerWidth;
        y = -(vector.y - 1) / 2 * (window.innerHeight * 0.8);
    } else {
        // Default to center if no position provided (e.g. for player hits)
        x = window.innerWidth / 2 + (Math.random() - 0.5) * 100;
        y = (window.innerHeight * 0.8) / 2 + (Math.random() - 0.5) * 100;
    }

    const container = document.getElementById('damage-numbers');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `damage-number ${className}`;
    el.textContent = amount;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    container.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

export function triggerBloodFlash() {
    const flash = document.getElementById('blood-flash');
    if (!flash) return;
    flash.classList.remove('active');
    void flash.offsetWidth; // Trigger reflow
    flash.classList.add('active');
}

export function updateCooldowns(player, cooldownOverlay, powerCooldownOverlay) {
    if (cooldownOverlay) {
        const percent = (player.attackCooldown / player.maxAttackCooldown) * 100;
        cooldownOverlay.style.height = `${percent}%`;
    }
    if (powerCooldownOverlay) {
        const percent = (player.secondaryCooldown / player.maxSecondaryCooldown) * 100;
        powerCooldownOverlay.style.height = `${percent}%`;
    }
}

export function initOverlayProtection() {
    ['game-over', 'victory', 'full-map-overlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.onmousedown = (e) => e.stopPropagation();
    });
}

export function setupCooldownOverlays() {
    const swordSlot = document.getElementById('slot-r-hand');
    if (!swordSlot) return { cooldownOverlay: null, powerCooldownOverlay: null };

    const cooldownOverlay = document.createElement('div');
    cooldownOverlay.className = 'cooldown-overlay';
    swordSlot.appendChild(cooldownOverlay);

    const powerCooldownOverlay = document.createElement('div');
    powerCooldownOverlay.className = 'cooldown-overlay secondary';
    swordSlot.appendChild(powerCooldownOverlay);

    return { cooldownOverlay, powerCooldownOverlay };
}

export function initTooltipTracking() {
    window.mouseX = 0;
    window.mouseY = 0;

    window.addEventListener('mousemove', (e) => {
        window.mouseX = e.clientX;
        window.mouseY = e.clientY;

        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            const x = window.mouseX + 15;
            const y = window.mouseY + 15;

            // Keep tooltip inside window boundaries
            const width = tooltip.offsetWidth;
            const height = tooltip.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            let finalX = x;
            let finalY = y;

            if (x + width > windowWidth) finalX = window.mouseX - width - 15;
            if (y + height > windowHeight) finalY = window.mouseY - height - 15;

            tooltip.style.left = `${finalX}px`;
            tooltip.style.top = `${finalY}px`;
        }
    });
}

