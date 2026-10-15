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
- **Match Up** (`memory.html`): flip cards to find pairs. Pick animals, letters, shapes, colors, fruit & veg or princesses, and easy (3 pairs), medium (6) or hard (8). Matching an animal plays its sound; best scores are saved per theme and level.
- **Maze Path** (`maze.html`): drag a little animal through a freshly made maze to its treat (mouse to cheese, puppy to bone and so on). Easy is 5x5, medium 7x7, hard 9x9. Arrow keys work too, and "Show me the way" draws the shortest route (breadth-first search) for a few seconds. Mazes won are saved. Code: `js/maze.js`, `css/maze.css`.
- **Spin the Wheel** (`wheel.html`): tap the wheel or the Spin button and it slows down to land on one of 8 animals, letters, shapes, colors or numbers. It says the name (and plays the animal sound) and counts spins. Code: `js/wheel.js`, `css/wheel.css`.
- **Shadow Match** (`shadow.html`): drag each picture onto its black silhouette (or tap a picture, then its shadow). Animals, shapes or letters; 2, 3 or 4 shadows. A wrong drop shakes the shadow, a right one fills it in and says the name. Wins are saved. Code: `js/shadow.js`, `css/shadow.css`.
- **Connect the Dots** (`dots.html`): tap numbered dots in order to draw a picture (kite, house, crown, heart, star, tree, castle and more), then it fills in and says what it is. Easy has 4 to 5 dots, medium 7 to 10, hard 10 to 12. Each number is spoken as it is tapped; wrong taps just shake. Pictures are lists of points in `js/dots.js`. Code: `js/dots.js`, `css/dots.css`.
- **Fruit Slice** (`slice.html`): fruit is tossed up the screen and the child swipes a finger across it to slice it in two, with juice splashes and a spoken name. No bombs, lives or losing: just slice 8, 12 or 16 fruits against the clock and beat your best time. Fruits come from `PRODUCE` in `js/data.js`. Code: `js/slice.js`, `css/slice.css`.
- **Dress Up** (`dress.html`): pick one of 10 animal friends and tap hats, glasses and neckwear to put them on (tap again to take off). It says what each thing is, has a "Surprise me" button, and celebrates a full outfit. The outfit is saved. Things to wear are in `js/dress.js`. Code: `js/dress.js`, `css/dress.css`.

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
