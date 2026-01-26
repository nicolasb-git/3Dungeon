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
- **Right Hand:** Your primary weapon.
- **Left Hand:** Shields or off-hand items.
- **Armor Slots:** Head, Torso, Shoulders, Legs, and Boots.

## 🗺️ Adding New Levels

Levels are defined as simple text files located in `src/maps/`. To add a new level:

1.  Create a new file named `{next_level_number}.txt` (e.g., `15.txt`) in the `src/maps/` directory.
2.  Use the following character mapping to design your maze:

| Character | Description |
| :--- | :--- |
| `*` | **Wall**: Solid block that blocks movement and sight. |
| `-` | **Secret Wall**: Looks like a wall but has no collision (walk-through). |
| `X` | **Starting Point**: Where the player spawns when entering the floor. |
| `O` | **Exit Door**: Stepping here teleports the player to the next floor. |
| `B` | **Boss Spawn**: Specific tile where the floor boss will spawn. |
| `0` | **Boss Exit**: An exit that only becomes visible/active after the boss is defeated. |
| ` ` | **Floor**: Empty space. Monsters will spawn randomly on these tiles. |

**Note:** The level logic automatically applies different themes based on the floor number (e.g., Floors 12+ use "Ancient" textures).

## 🛠️ Project Structure
- `src/main.js`: Main game loop and UI initialization.
- `src/dungeon.js`: Map parsing and 3D environment generation.
- `src/player.js`: Movement, collision, and player stats.
- `src/gameLogic.js`: Combat and loot systems.
- `src/maps/`: Text-based level layouts.

Good luck, adventurer. May the light guide you through Kaerith's Maze.

---

## 📜 License

This project is licensed under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/) license.

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
