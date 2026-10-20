# Little Desk

A cozy, click-everything lofi study game made with Phaser 4. Someone studies
late at night at a little desk by the window: write your tasks on sticky
notes, earn coins for finishing them, and spend them in the corner shop on
new lamps, clocks and even a new place to study, a porch looking over the
Vietnamese rice paddies, where frog hunters wander with headlamps.

No image or audio files are needed: everything is drawn and played in code.
Available in English and Vietnamese.

## Run it

1. Install Node.js (LTS) from https://nodejs.org
2. In this folder:

   ```
   npm install
   npm run dev
   ```

3. Open the link it prints (usually http://localhost:5173). Edits reload instantly.

`npm run build` makes a `dist/` folder you can upload to itch.io, Netlify,
GitHub Pages, etc. Pushing to `main` on GitHub deploys it to GitHub Pages
automatically (see `.github/workflows/deploy.yml`).

## What's where

```
index.html                  page that holds the game
src/main.js                 game config (size, scaling, scenes)
src/scenes/RoomScene.js     builds the current place; depth (z-order) guide at the top
src/objects/Sky.js          stars, constellations, moon phases, shooting stars
src/objects/Street.js       city view: buildings, street lamps, corner shop, people who wave back
src/objects/Countryside.js  countryside view: rice paddies, frog hunters, village road, grocery
src/objects/Room.js         wall, window, curtains, fairy lights, task board, clock, desk, chair
src/objects/Student.js      the person at the desk (stretch, wave, type, sip, look around)
src/objects/Props.js        lamp, laptop, mug, books, radio, plant, cat
src/objects/items.js        everything the shop sells, and how each item is drawn
src/audio/lofi.js           generated lo-fi music for the radio
src/audio/sfx.js            generated click sounds for every object
src/ui/                     HTML overlays: task board, shop, settings, coin counter
src/utils/tasks.js          the to-do list (saved in localStorage)
src/utils/shop.js           coins, purchases, what's equipped (saved in localStorage)
src/utils/i18n.js           all the game's text, in English and Vietnamese
src/utils/hotspot.js        makes anything clickable (hover tooltip + squish)
src/utils/fx.js             floating text, speech bubbles, glow lights, tooltip
```

## Adding a new interactive thing

Copy a function in `src/objects/Props.js` (the mug is a good template),
draw your object, then wrap it in `makeHotspot(...)` with a label and an
`onClick`. Put its text in `src/utils/i18n.js` and call your function from
`createProps()`.

## Adding something to the shop

Add an entry to `LAMPS` or `CLOCKS` in `src/objects/items.js` with an `id`,
a `price` and a `draw(ctx)` function, then add its name (`item.<id>`) in both
languages in `src/utils/i18n.js`. It shows up in the shop automatically.
