# Play Time

Double-click `index.html` to open it in any browser. No account, server or install needed.

## Games
- **Animal Cards** (`animals.html`): 59 animals in 6 groups. Swipe cards away like Tinder, tap to hear the name and the animal's sound, rewind, shuffle, and collect a star sticker for every animal you meet.
- **Alphabet** (`alphabet.html`)
  - Learn: a carousel of A to Z cards. Three show at a time with the middle one largest; swipe, tap a side card, or use the arrows.
  - Play: two kinds of question ("what letter does it start with?" and "which picture starts with this letter?"), with stars, a streak counter and confetti.

- **Fun Shapes** (`shapes.html`): *Explore* a playground of drifting shapes (tap one to meet it), *Sort* shapes by dragging them into the matching holes, and a *Quiz* ("what shape is this?", "find the circle").

- **Fun Colors** (`colors.html`): *Paint* with a finger-painting studio (tap a pot to hear the color), *Pop* balloons of the color you are asked for, and a *Quiz*.
- **Counting Fun** (`numbers.html`): *Train* (scroll a number train, tap a wagon to count what it carries), *Feed* a hungry hippo exactly the number of cookies it asks for, and a *Quiz*.
- **Match Up** (`memory.html`): flip cards to find pairs. Pick animals, letters, shapes, colors or princesses, and easy (3 pairs), medium (6) or hard (8). Matching an animal plays its sound; best scores are saved per theme and level.

## Play timer
The hourglass button in every top bar sets a play timer (5 to 60 minutes). The time left shows on the button. When it runs out, a full-screen cover blocks the whole page. A grown-up solves a small multiplication sum to add time or stop the timer. The end time is saved, so reloading the page or switching games does not get around it. Code: `js/timer.js`.

## Light and dark mode
Every page has a moon/sun button in the top bar. It switches between light and dark and remembers the choice. The grown-ups panel also has an Auto option that follows the device. `js/theme.js` applies the saved theme before the page paints so there is no flash.

## Grown-ups panel
The sliders button in each game has these settings: voice on/off, sounds on/off, play by itself after a swipe, show sound words, 3 or 4 answers, ABC or abc, and clear progress. Settings and progress are saved in the browser on this device.

## Files
- `js/theme.js` applies the saved light/dark choice early
- `css/base.css` colors, fonts, buttons, settings panel, celebrations (light and dark mode)
- `css/deck.css` the swipeable card stack and the shelf
- `css/quiz.css` the answer-picking screen shared by Alphabet and Shapes
- `css/hub.css`, `css/alphabet.css`, `css/shapes.css`, `css/colors.css`, `css/memory.css`, `css/paint.css`, `css/train.css`, `css/sorter.css` the menu and each game's extras
- `js/core.js` saving, speech, full screen, settings, confetti
- `js/audio.js` all sounds, synthesized in the browser (works offline)
- `js/deck.js` the Tinder-style swipe
- `js/data.js` **all the animals and letters**: edit this to add more
- `js/animals.js`, `js/alphabet.js`, `js/shapes.js`, `js/paint.js`, `js/train.js`, `js/sorter.js`, `js/topic.js`, `js/memory.js`, `js/hub.js` each page's logic

To add an animal, add a line to its group in `js/data.js`:
`["Name", "🐾", "Sound words!", "soundKey", "#cardColor"]`.
The sound keys are listed in `js/audio.js`.
