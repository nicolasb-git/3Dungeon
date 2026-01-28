class DungeonEditor {
    constructor() {
        this.width = 20;
        this.height = 20;
        this.gridData = []; // 2D array of chars
        this.selectedChar = '*';
        this.isDrawing = false;

        this.elements = {
            grid: document.getElementById('grid'),
            btnNew: document.getElementById('btn-new'),
            btnOpen: document.getElementById('btn-open'),
            btnSave: document.getElementById('btn-save'),
            btnSaveProject: document.getElementById('btn-save-project'),
            floorNum: document.getElementById('floor-num'),
            fileInput: document.getElementById('file-input'),
            statusPos: document.getElementById('status-pos'),
            statusMsg: document.getElementById('status-msg'),
            statSize: document.getElementById('stat-size'),
            statTiles: document.getElementById('stat-tiles'),
            modalNew: document.getElementById('modal-new'),
            newConfirm: document.getElementById('new-confirm'),
            newCancel: document.getElementById('new-cancel'),
            newWidth: document.getElementById('new-width'),
            newHeight: document.getElementById('new-height'),
            palette: document.querySelectorAll('.tool')
        };

        this.init();
    }

    init() {
        this.createEmptyMap(this.width, this.height);
        this.setupEventListeners();
        this.renderGrid();

        // Check if we are local. If not, hide "Save to Project"
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            this.elements.btnSaveProject.style.display = 'none';
            // Also hide the floor input group if you like
            const saveGroup = document.querySelector('.save-group');
            if (saveGroup) saveGroup.style.display = 'none';
        }
    }

    createEmptyMap(w, h) {
        this.width = w;
        this.height = h;
        this.gridData = Array(h).fill(null).map(() => Array(w).fill(' '));

        // Add border walls by default
        for (let x = 0; x < w; x++) {
            this.gridData[0][x] = '*';
            this.gridData[h - 1][x] = '*';
        }
        for (let y = 0; y < h; y++) {
            this.gridData[y][0] = '*';
            this.gridData[y][w - 1] = '*';
        }

        this.updateStats();
    }

    setupEventListeners() {
        // Palette selection
        this.elements.palette.forEach(tool => {
            tool.addEventListener('click', () => {
                this.elements.palette.forEach(t => t.classList.remove('active'));
                tool.classList.add('active');
                this.selectedChar = tool.dataset.char;
            });
        });

        // Grid interactions
        this.elements.grid.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('cell')) {
                this.isDrawing = true;
                this.paintCell(e.target);
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        this.elements.grid.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('cell')) {
                const x = parseInt(e.target.dataset.x);
                const y = parseInt(e.target.dataset.y);
                this.elements.statusPos.textContent = `Pos: ${x}, ${y}`;

                if (this.isDrawing) {
                    this.paintCell(e.target);
                }
            }
        });

        // Toolbar Buttons
        this.elements.btnNew.addEventListener('click', () => {
            this.elements.modalNew.style.display = 'flex';
        });

        this.elements.newCancel.addEventListener('click', () => {
            this.elements.modalNew.style.display = 'none';
        });

        this.elements.newConfirm.addEventListener('click', () => {
            const w = parseInt(this.elements.newWidth.value);
            const h = parseInt(this.elements.newHeight.value);
            if (w > 0 && h > 0) {
                this.createEmptyMap(w, h);
                this.renderGrid();
                this.elements.modalNew.style.display = 'none';
                this.showMessage(`Created new ${w}x${h} map`);
            }
        });

        this.elements.btnOpen.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                this.loadMapData(event.target.result);
                this.elements.fileInput.value = ''; // Reset for next time
            };
            reader.readAsText(file);
        });

        this.elements.btnSave.addEventListener('click', () => {
            this.exportMap();
        });

        this.elements.btnSaveProject.addEventListener('click', () => {
            this.saveToProject();
        });

        // Hotkeys
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key >= '1' && e.key <= '7') {
                    e.preventDefault();
                    const index = parseInt(e.key) - 1;
                    if (this.elements.palette[index]) {
                        this.elements.palette[index].click();
                    }
                }
                if (e.key === 's') {
                    e.preventDefault();
                    this.exportMap();
                }
            }
        });
    }

    paintCell(cell) {
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);

        this.gridData[y][x] = this.selectedChar;
        this.updateCellVisual(cell, this.selectedChar);
    }

    updateCellVisual(cell, char) {
        cell.textContent = char === ' ' ? '' : char;

        const typeMap = {
            '*': 'wall',
            ' ': 'floor',
            '-': 'secret',
            'X': 'start',
            'O': 'exit',
            'B': 'boss',
            '0': 'boss-exit'
        };

        cell.dataset.type = typeMap[char] || 'floor';
    }

    renderGrid() {
        this.elements.grid.innerHTML = '';
        this.elements.grid.style.gridTemplateColumns = `repeat(${this.width}, 32px)`;
        this.elements.grid.style.gridTemplateRows = `repeat(${this.height}, 32px)`;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.x = x;
                cell.dataset.y = y;
                this.updateCellVisual(cell, this.gridData[y][x]);
                this.elements.grid.appendChild(cell);
            }
        }
    }

    loadMapData(text) {
        const lines = text.split('\n').filter(l => l.length > 0);
        if (lines.length === 0) return;

        this.height = lines.length;
        this.width = Math.max(...lines.map(l => l.length));

        this.gridData = lines.map(line => {
            return line.padEnd(this.width, ' ').split('');
        });

        this.renderGrid();
        this.updateStats();
        this.showMessage(`Loaded map: ${this.width}x${this.height}`);
    }

    exportMap() {
        if (!this.validateMap()) return;

        const content = this.gridData.map(row => row.join('')).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `level_${this.elements.floorNum.value}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        this.showMessage('Map exported successfully');
    }

    async saveToProject() {
        if (!this.validateMap()) return;

        const content = this.gridData.map(row => row.join('')).join('\n');
        const floor = this.elements.floorNum.value;

        if (!floor) {
            this.showMessage('Error: Please specify a floor number');
            return;
        }

        this.showMessage('Saving to project...');

        try {
            const response = await fetch('/api/save-map', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ floor, content }),
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage(data.message);
                // Trigger a page refresh in the game if it was open? 
                // No, but the message is enough.
            } else {
                this.showMessage(`Error: ${data.error || 'Failed to save'}`);
            }
        } catch (err) {
            console.error(err);
            this.showMessage('Error: Could not connect to development server');
        }
    }

    validateMap() {
        let hasStart = false;
        let hasExit = false;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const char = this.gridData[y][x];
                if (char === 'X') hasStart = true;
                if (char === 'O' || char === '0') hasExit = true;
            }
        }

        if (!hasStart) {
            alert('Missing Player Start (X)! Every map needs at least one starting point.');
            this.showMessage('Error: Missing Start');
            return false;
        }

        if (!hasExit) {
            const confirmSave = confirm('No Exit found (O or 0). Player will be stuck. Save anyway?');
            if (!confirmSave) {
                this.showMessage('Save cancelled: Missing Exit');
                return false;
            }
        }

        return true;
    }

    updateStats() {
        this.elements.statSize.textContent = `${this.width}x${this.height}`;
        this.elements.statTiles.textContent = this.width * this.height;
    }

    showMessage(msg) {
        this.elements.statusMsg.textContent = msg;
        setTimeout(() => {
            if (this.elements.statusMsg.textContent === msg) {
                this.elements.statusMsg.textContent = 'Dungeon Editor Ready';
            }
        }, 3000);
    }
}

// Start Editor
window.addEventListener('DOMContentLoaded', () => {
    new DungeonEditor();
});
