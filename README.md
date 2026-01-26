# Kaerith's Maze

A dark, immersive 3D dungeon crawler built with Three.js. Navigate through procedural-style levels, fight monsters, collect loot, and manage your equipment as you descend deeper into the maze.

## 🎮 How to Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/nicolasb-git/3Dungeon.git
   cd 3Dungeon
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

---

## 🕹️ Player Guide

### Controls
| Key | Action |
| :--- | :--- |
| **W / A / S / D** | Move Forward / Left / Backward / Right |
| **Mouse** | Look Around |
| **Left Click** | Standard Attack |
| **Right Click** | Power Attack (Requires cooldown) |
| **M** | Toggle Full Map |
| **T** | Visit the Sly Vendor (Teleport) |
| **Click Inventory Slot** | Equip Item / Use Potion |

### Gameplay Mechanics

#### ⚔️ Combat
- **Standard Attack:** Fast, reliable damage based on your equipped weapon.
- **Power Attack:** High damage area-of-effect strike. Watch for the screen glow to know when it's ready!
- **Levels:** Defeat enemies to gain XP. Leveling up increases your Max HP, Strength, and Defense.

#### 🗺️ Exploration
- **Line of Sight:** The minimap and full map only show what you have discovered. Tiles behind walls or beyond your sight will remain hidden until you explore them.
- **Secret Passages:** Some walls aren't what they seem. Look for subtle hints to find hidden paths.
- **Save Points:** The game saves your progress every time you descend to a new floor.

#### 💰 Economy & Survival
- **Bribing the Maze:** If you die or exit the game, the Maze demands a tribute of **25 Gold per Level** to resume your journey.
- **Vendor:** Collect gold from fallen enemies and sell items you don't need to buy powerful gear and potions.

#### 🛡️ Equipment
Manage your gear in the HUD to survive deeper floors:
- **Weapons:** Primary source of damage.
- **Armor:** Reduces incoming damage from monsters.
- **Consumables:** Keep health potions in your backpack for emergencies.

---

## 🛠️ Project Structure
- `src/main.js`: Main entry point and game loop.
- `src/player.js`: Player logic, movement, and map rendering.
- `src/dungeon.js`: 3D Environment generation.
- `src/gameLogic.js`: Combat and loot systems.
- `src/maps/`: Text-based level layouts.

Good luck, adventurer. May the light guide you through Kaerith's Maze.

---

## 📜 License

This project is licensed under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/) license.

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
