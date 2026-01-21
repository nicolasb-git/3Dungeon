---
description: Generate and deploy assets for the Cultist monster
---

1. Generate the idle icon for the Cultist
// turbo
generate_image(ImageName: "cultist_idle_next", Prompt: "A single 2D pixel art monster 'Dark Cultist'. Dark purple robes, hood, glowing eyes. Holding a staff. Isolated on a perfectly flat solid green (#00FF00) background. No white pixels or borders. 128x128 pixels. RPG enemy style.")

2. Generate the attack icon for the Cultist
// turbo
generate_image(ImageName: "cultist_attack_next", Prompt: "A single 2D pixel art monster 'Dark Cultist'. Dark purple robes, hood, glowing eyes. Attacking pose with staff raised, purple energy. Isolated on a perfectly flat solid green (#00FF00) background. No white pixels or borders. 128x128 pixels. RPG enemy style.")

3. Copy the generated images to the public directory
// turbo
run_command(CommandLine: "Copy-Item \"<path_to_cultist_idle_next>\" \"c:\\workspace\\3D dungeon\\public\\cultist_idle.png\"; Copy-Item \"<path_to_cultist_attack_next>\" \"c:\\workspace\\3D dungeon\\public\\cultist_attack.png\"", Cwd: "c:\\workspace\\3D dungeon", SafeToAutoRun: true, WaitMsBeforeAsync: 500)
