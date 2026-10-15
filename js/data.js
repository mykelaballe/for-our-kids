/* Game content.
   Animals: [name, emoji, words in the sound bubble, sound key from audio.js, card color]
   Letters: [letter, word, emoji, card color, optional sound key] */
const ANIMAL_GROUPS = [
  { id:"farm", label:"Farm", icon:"🚜", shelf:"Farm animals", cheer:"You met every farm animal!", animals:[
    ["Cow", "🐮", "Moo moo!", "moo", "#F7D0DF"],
    ["Pig", "🐷", "Oink oink!", "oink", "#FFB8C6"],
    ["Sheep", "🐑", "Baa baa!", "baa", "#DCE9F5"],
    ["Horse", "🐴", "Neigh!", "neigh", "#E8B98A"],
    ["Chicken", "🐔", "Cluck cluck!", "cluck", "#FFE27A"],
    ["Duck", "🦆", "Quack quack!", "quack", "#9FE0C9"],
    ["Goat", "🐐", "Maa maa!", "goat", "#D9E7A6"],
    ["Rooster", "🐓", "Cock-a-doodle-doo!", "rooster", "#FFB37A"],
    ["Turkey", "🦃", "Gobble gobble!", "gobble", "#D9B48F"],
    ["Rabbit", "🐰", "Sniff sniff!", "sniff", "#E7DDF8"]
  ]},
  { id:"pets", label:"Pets", icon:"🏡", shelf:"Pets", cheer:"You met all the pets!", animals:[
    ["Dog", "🐶", "Woof woof!", "woof", "#FFD59A"],
    ["Cat", "🐱", "Meow!", "meow", "#FFC9A3"],
    ["Mouse", "🐭", "Squeak squeak!", "squeak", "#DDE3EA"],
    ["Hamster", "🐹", "Nibble nibble!", "nibble", "#FFE0B8"],
    ["Parrot", "🦜", "Hello! Squawk!", "squawk", "#9FE6A0"],
    ["Fish", "🐟", "Blub blub!", "blub", "#A9D8FF"],
    ["Turtle", "🐢", "Munch munch!", "munch", "#C6E59B"],
    ["Frog", "🐸", "Ribbit!", "ribbit", "#B8F08A"]
  ]},
  { id:"wild", label:"Wild", icon:"🌳", shelf:"Wild animals", cheer:"You met every wild animal!", animals:[
    ["Lion", "🦁", "Roar!", "roar", "#FFCC66"],
    ["Elephant", "🐘", "Pawoo!", "trumpet", "#CFD8E6"],
    ["Monkey", "🐵", "Ooh ooh ah ah!", "monkey", "#E3C29B"],
    ["Tiger", "🐯", "Grrr!", "growl", "#FFB066"],
    ["Bear", "🐻", "Grrrowl!", "bear", "#D8B08C"],
    ["Giraffe", "🦒", "Munch munch!", "munch", "#FFE38F"],
    ["Zebra", "🦓", "Neigh!", "neigh", "#E9E9EE"],
    ["Snake", "🐍", "Hissss!", "hiss", "#C3EBA0"],
    ["Wolf", "🐺", "Awooo!", "howl", "#C9D3E3"],
    ["Owl", "🦉", "Hoo hoo!", "hoot", "#D9C6EF"],
    ["Fox", "🦊", "Ring-ding-ding!", "yip", "#FFB98A"],
    ["Deer", "🦌", "Snort snort!", "snort", "#E6C9A0"],
    ["Hippo", "🦛", "Grunt grunt!", "grunt", "#D5C6E8"],
    ["Rhino", "🦏", "Snort!", "snort", "#CBD2DC"],
    ["Kangaroo", "🦘", "Boing boing!", "boing", "#F2C08F"],
    ["Panda", "🐼", "Munch munch!", "munch", "#E4EBE2"],
    ["Camel", "🐪", "Grumble!", "grumble", "#EDD3A0"],
    ["Gorilla", "🦍", "Hoo hoo hoo!", "gorilla", "#C9C3D6"],
    ["Koala", "🐨", "Snooze snooze!", "snore", "#D3DAE6"],
    ["Raccoon", "🦝", "Chitter chatter!", "chitter", "#D6D0D9"]
  ]},
  { id:"sea", label:"Sea", icon:"🌊", shelf:"Sea creatures", cheer:"You met everyone in the sea!", animals:[
    ["Whale", "🐳", "Ooooo-ooo!", "whale", "#9FD3FF"],
    ["Dolphin", "🐬", "Eee eee!", "dolphin", "#A8E6F0"],
    ["Octopus", "🐙", "Wiggle wiggle!", "blub", "#FFB3C9"],
    ["Crab", "🦀", "Click click!", "click", "#FFB09A"],
    ["Seal", "🦭", "Arf arf!", "arf", "#CFE0EC"],
    ["Penguin", "🐧", "Honk honk!", "honk", "#D6E4F5"],
    ["Shark", "🦈", "Chomp chomp!", "chomp", "#B9CCE0"]
  ]},
  { id:"myth", label:"Mythical", icon:"✨", shelf:"Mythical creatures", cheer:"You met every magical creature!", animals:[
    ["Unicorn", "🦄", "Neigh! Sparkle!", "unicorn", "#F5D0F0"],
    ["Dragon", "🐉", "Roar! Whoosh!", "dragon", "#B8EBA0"],
    ["Mermaid", "🧜", "La la la!", "sing", "#A8E4F2"],
    ["Fairy", "🧚", "Tinkle tinkle!", "chime", "#E6D0FA"],
    ["Genie", "🧞", "Poof!", "poof", "#B9C9FF"],
    ["Ghost", "👻", "Boo!", "ghost", "#E9E6F5"],
    ["Alien", "👽", "Bleep bloop!", "beep", "#C6F0A8"],
    ["Troll", "🧌", "Grumble grumble!", "growl", "#BFD9A0"]
  ]},
  { id:"bugs", label:"Bugs & Birds", icon:"🐝", shelf:"Bugs and birds", cheer:"You met all the bugs and birds!", animals:[
    ["Bee", "🐝", "Buzz buzz!", "buzz", "#FFE066"],
    ["Ladybug", "🐞", "Flutter!", "flutter", "#FFB0A8"],
    ["Butterfly", "🦋", "Flap flap!", "flutter", "#C9DBFF"],
    ["Snail", "🐌", "Slow and slimy!", "slime", "#E7D9C4"],
    ["Bird", "🐦", "Tweet tweet!", "tweet", "#A6E3F5"],
    ["Chick", "🐥", "Cheep cheep!", "cheep", "#FFF08A"]
  ]}
];

const LETTERS = [
  ["A", "Apple", "🍎", "#FFB8C6"],
  ["B", "Banana", "🍌", "#FFE27A"],
  ["C", "Cat", "🐱", "#FFC9A3", "meow"],
  ["D", "Dog", "🐶", "#FFD59A", "woof"],
  ["E", "Elephant", "🐘", "#CFD8E6", "trumpet"],
  ["F", "Fish", "🐟", "#A9D8FF", "blub"],
  ["G", "Grapes", "🍇", "#D9C6EF"],
  ["H", "House", "🏠", "#FFB37A"],
  ["I", "Ice cream", "🍦", "#F7D0DF"],
  ["J", "Juice", "🧃", "#C6E59B"],
  ["K", "Kite", "🪁", "#9FD3FF"],
  ["L", "Lion", "🦁", "#FFCC66", "roar"],
  ["M", "Moon", "🌙", "#C9D3E3"],
  ["N", "Nose", "👃", "#FFD9B8", "sniff"],
  ["O", "Orange", "🍊", "#FFB98A"],
  ["P", "Pizza", "🍕", "#FFE38F"],
  ["Q", "Queen", "👸", "#E7DDF8"],
  ["R", "Rainbow", "🌈", "#A6E3F5"],
  ["S", "Sun", "☀️", "#FFE066"],
  ["T", "Tree", "🌳", "#B8F08A"],
  ["U", "Umbrella", "☂️", "#E6D0FA"],
  ["V", "Violin", "🎻", "#E8B98A"],
  ["W", "Whale", "🐳", "#9FD3FF", "whale"],
  ["X", "X-ray", "🩻", "#DDE3EA"],
  ["Y", "Yo-yo", "🪀", "#FFB0A8"],
  ["Z", "Zebra", "🦓", "#E9E9EE", "neigh"]
];

const ANIMAL_TOTAL = ANIMAL_GROUPS.reduce((n, g) => n + g.animals.length, 0);

/* Shapes: [id, name, fact, card color, shape color] */
const SHAPES = [
  ["circle", "Circle", "Round, with no corners. Like a ball!", "#FFE27A", "#EB5757"],
  ["square", "Square", "4 sides that are all the same. Like a window!", "#A8E4F2", "#2F80ED"],
  ["triangle", "Triangle", "3 sides and 3 corners. Like a slice of pizza!", "#FFC9A3", "#27AE60"],
  ["rectangle", "Rectangle", "4 sides, 2 long and 2 short. Like a door!", "#D9C6EF", "#F2994A"],
  ["oval", "Oval", "Round, but stretched. Like an egg!", "#B8F08A", "#BB6BD9"],
  ["star", "Star", "5 points. Like the stars in the sky!", "#9FD3FF", "#F2C94C"],
  ["heart", "Heart", "Round on top, pointy at the bottom. Like a valentine!", "#FFD0DD", "#EB5757"],
  ["diamond", "Diamond", "4 equal sides, standing on a point. Like a kite!", "#FFB37A", "#2D9CDB"],
  ["pentagon", "Pentagon", "5 sides. Like a baseball home plate!", "#C6E59B", "#9B51E0"],
  ["hexagon", "Hexagon", "6 sides. Like a honeycomb!", "#FFE0B8", "#F2994A"],
  ["octagon", "Octagon", "8 sides. Like a stop sign!", "#CFD8E6", "#EB5757"],
  ["crescent", "Crescent", "Curved, with two points. Like the moon!", "#D9C6EF", "#F2C94C"],
  ["plus", "Plus", "4 arms that are all the same. Like a plus sign!", "#C6E59B", "#EB5757"],
  ["arrow", "Arrow", "It points the way. Like a road sign!", "#A8E4F2", "#27AE60"],
  ["trapezoid", "Trapezoid", "4 sides, and the top is shorter than the bottom. Like a bucket!", "#FFD59A", "#9B51E0"],
  ["parallelogram", "Parallelogram", "4 sides, leaning to one side. Like a slanted rectangle!", "#FFC9A3", "#2F80ED"],
  ["semicircle", "Semicircle", "Half of a circle. Like a slice of watermelon!", "#FFE27A", "#EB5757"]
];
const SHAPE_PATHS = {
  circle:'<circle cx="50" cy="50" r="40"/>',
  square:'<rect x="14" y="14" width="72" height="72" rx="5"/>',
  triangle:'<polygon points="50,10 92,86 8,86"/>',
  rectangle:'<rect x="6" y="26" width="88" height="48" rx="5"/>',
  oval:'<ellipse cx="50" cy="50" rx="44" ry="29"/>',
  star:'<polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38"/>',
  heart:'<path d="M50 88 C14 60 6 40 6 28 C6 14 18 6 30 6 C40 6 47 12 50 20 C53 12 60 6 70 6 C82 6 94 14 94 28 C94 40 86 60 50 88 Z"/>',
  diamond:'<polygon points="50,6 90,50 50,94 10,50"/>',
  pentagon:'<polygon points="50,8 92,38 76,88 24,88 8,38"/>',
  hexagon:'<polygon points="27,10 73,10 96,50 73,90 27,90 4,50"/>',
  octagon:'<polygon points="32,6 68,6 94,32 94,68 68,94 32,94 6,68 6,32"/>',
  crescent:'<path d="M75.9 16.9 A42 42 0 1 0 75.9 83.1 A34 34 0 1 1 75.9 16.9 Z"/>',
  plus:'<polygon points="35,8 65,8 65,35 92,35 92,65 65,65 65,92 35,92 35,65 8,65 8,35 35,35"/>',
  arrow:'<polygon points="6,36 56,36 56,14 94,50 56,86 56,64 6,64"/>',
  trapezoid:'<polygon points="30,22 70,22 94,78 6,78"/>',
  parallelogram:'<polygon points="26,24 94,24 74,76 6,76"/>',
  semicircle:'<path d="M6 72 A44 44 0 0 1 94 72 Z"/>'
};
// The picture of a shape as inline SVG, so it scales crisply and takes any color.
const shapeSvg = (id, fill) =>
  `<svg viewBox="0 0 100 100" aria-hidden="true" fill="${fill}" stroke="rgba(43,35,64,.3)" stroke-width="3" stroke-linejoin="round">${SHAPE_PATHS[id]}</svg>`;

/* Princesses: [name, picture file in img/princesses, card color].
   The pictures are cropped from a wallpaper supplied by the owner (see CLAUDE.md). */
const PRINCESSES = [
  ["Cinderella", "cinderella", "#A9D8F2"],
  ["Snow White", "snow-white", "#FFF08A"],
  ["Pocahontas", "pocahontas", "#CDB4E6"],
  ["Belle", "belle", "#FFF08A"],
  ["Moana", "moana", "#F58FA0"],
  ["Merida", "merida", "#A9D8F2"],
  ["Mulan", "mulan", "#B8E39B"],
  ["Rapunzel", "rapunzel", "#F7A8C8"],
  ["Jasmine", "jasmine", "#CDB4E6"],
  ["Aurora", "aurora", "#F7A8C8"],
  ["Ariel", "ariel", "#F58FA0"],
  ["Tiana", "tiana", "#B8E39B"]
];

/* Colors: [id, name, color, card color, example emoji, "like ..." phrase] */
const COLORS = [
  ["red", "Red", "#E53935", "#FFD0D0", "🍎", "an apple"],
  ["orange", "Orange", "#FB8C00", "#FFDDB8", "🍊", "an orange"],
  ["yellow", "Yellow", "#FDD835", "#FFF0A8", "🍌", "a banana"],
  ["green", "Green", "#43A047", "#C4EBCF", "🐸", "a frog"],
  ["blue", "Blue", "#1E88E5", "#CFE3FF", "🐳", "a whale"],
  ["purple", "Purple", "#8E24AA", "#E3D0F7", "🍇", "grapes"],
  ["pink", "Pink", "#FF6FA5", "#FFD3E4", "🌸", "a flower"],
  ["brown", "Brown", "#8D5A2B", "#E8D2B8", "🐻", "a bear"],
  ["gray", "Gray", "#9AA0A6", "#E4E6EA", "🐭", "a mouse"],
  ["black", "Black", "#2B2B33", "#D9D9E0", "🦇", "a bat"],
  ["white", "White", "#FFFFFF", "#E3EDF8", "☁️", "a cloud"]
];
/* Numbers: [number, name, emoji to count, singular, plural, card color] */
const NUMBERS = [
  [1, "One", "🍎", "apple", "apples", "#FFD0D0"],
  [2, "Two", "🐥", "chick", "chicks", "#FFF0A8"],
  [3, "Three", "🌸", "flower", "flowers", "#FFD3E4"],
  [4, "Four", "🚗", "car", "cars", "#CFE3FF"],
  [5, "Five", "⭐", "star", "stars", "#FFE9A8"],
  [6, "Six", "🐞", "ladybug", "ladybugs", "#C4EBCF"],
  [7, "Seven", "🎈", "balloon", "balloons", "#E3D0F7"],
  [8, "Eight", "🍪", "cookie", "cookies", "#E8D2B8"],
  [9, "Nine", "🐟", "fish", "fish", "#CFE9F5"],
  [10, "Ten", "🍓", "strawberry", "strawberries", "#FFD0D8"]
];

/* Fruits and vegetables for Match Up: [name, emoji, card color] */
const PRODUCE = [
  ["Apple", "🍎", "#FFD0D0"], ["Banana", "🍌", "#FFF0A8"], ["Grapes", "🍇", "#E3D0F7"], ["Strawberry", "🍓", "#FFD0D8"],
  ["Orange", "🍊", "#FFDDB8"], ["Watermelon", "🍉", "#C4EBCF"], ["Pineapple", "🍍", "#FFE9A8"], ["Cherries", "🍒", "#FFD3E4"],
  ["Pear", "🍐", "#DDEFB5"], ["Lemon", "🍋", "#FFF4B0"], ["Carrot", "🥕", "#FFDDB8"], ["Broccoli", "🥦", "#C4EBCF"],
  ["Corn", "🌽", "#FFF0A8"], ["Tomato", "🍅", "#FFD0D0"], ["Potato", "🥔", "#E8D2B8"], ["Eggplant", "🍆", "#E3D0F7"],
  ["Cucumber", "🥒", "#CFEBD2"]
];
