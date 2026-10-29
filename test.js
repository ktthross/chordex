// node test.js
const assert = require('assert');
const { guitarVoicings, pianoVoicings, shape } = require('./chords.js');

const shapes = (r, q) => guitarVoicings(r, q).map(v => shape(v.frets));
assert.equal(shapes(0, '')[0], 'x32010'); // open C first
assert.equal(shapes(4, '')[0], '022100'); // open E first
assert(shapes(7, '').includes('320003')); // open G
assert(shapes(2, '').includes('xx0232')); // open D
assert(shapes(5, '').includes('133211')); // F barre
assert(shapes(11, 'm').includes('x24432')); // Bm barre
assert(shapes(9, 'm7').includes('x02010')); // open Am7

const [rootPos, first] = pianoVoicings(0, '');
assert.deepEqual(rootPos.notes, [60, 64, 67]); // C4 E4 G4
assert.deepEqual(first.notes, [64, 67, 72]); // E4 G4 C5
assert.deepEqual(pianoVoicings(0, 'maj7').find(v => v.label === 'Drop 2').notes, [55, 60, 64, 71]); // G3 C4 E4 B4
console.log('ok');
