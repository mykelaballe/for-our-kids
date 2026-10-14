# Play Time

A static web app of toddler learning games, built for the owner's kids. Plain HTML, CSS and JavaScript with no build step, no framework and no dependencies. Hosted on Vercel from the `main` branch of `mykelaballe/for-our-kids`.

## Git workflow
- **After every response that changes files, commit the changes.** Do not wait to be asked, and do not leave work uncommitted. Use a short message that says what changed and why, and end it with the attribution line for the commit.
- Commit only. Do not push on your own. Pushing to `main` deploys the live site, so it only happens when the user runs `/publish`.
- If a response changed no files, there is nothing to commit.

## Working rules
- Do not open a browser after changes (`open index.html` and the like). The user refreshes the page themselves.
- The site must keep working when `index.html` is opened straight from disk, so use plain `<script>` tags, not ES modules, and relative paths.
- Light and dark mode both matter. Style with the tokens in `css/base.css` (`--paper`, `--ink`, `--paper-2` and so on). Never hard-code a color that only works in one theme, except on the colorful cards, balloons and shapes, which stay bright in both.
- Every game needs to work with a finger on a phone or tablet: big tap targets, `touch-action` set where dragging happens, and `prefers-reduced-motion` respected.
- Node and Python are not installed on this machine. To syntax-check a script, use `osascript -l JavaScript` with `new Function(source)`.

## Layout
- `index.html` game menu. `animals.html`, `alphabet.html`, `shapes.html`, `colors.html`, `numbers.html`, `memory.html` are the games.
- `css/base.css` shared tokens, buttons, settings sheet, timer cover. Each game adds its own small stylesheet.
- `js/core.js` (`PT`) saving, speech, theme, mode tabs, celebrations. `js/audio.js` all sounds, synthesized in the browser. `js/timer.js` play timer. `js/data.js` all animals, letters, shapes, colors, numbers and princesses.
- Progress and settings are saved in `localStorage` under `playtime.v2`.

## Content
To add an animal, letter, shape or princess, edit `js/data.js`. Animal sound keys are defined in `js/audio.js`. There is no official character artwork, so characters are shown with emoji.
