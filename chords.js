// Chord theory + voicing search. Plain <script> in the browser, require()-able from node for test.js.
const NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Suggested next chords as [semitones up, quality], relative to the current chord.
const MAJ = [[5, ''], [7, ''], [9, 'm'], [2, 'm'], [7, '7'], [10, '']]; // IV V vi ii V7 bVII
const MIN = [[5, 'm'], [7, '7'], [8, ''], [3, ''], [10, ''], [7, 'm']]; // iv V7 bVI bIII bVII v
const DOM = [[5, ''], [5, 'm'], [5, 'maj7'], [2, 'm']]; // resolve to I / i / Imaj7, deceptive vi
const SUS = [[0, ''], [0, '7'], [5, ''], [7, '']];
const DIM = [[1, ''], [1, 'm']];
const HDIM = [[5, '7'], [10, 'm']]; // ii-V-i in minor
const AUG = [[5, ''], [0, '6'], [9, 'm']];

const QUALITIES = new Map([
  ['', [[0, 4, 7], MAJ]], ['m', [[0, 3, 7], MIN]], ['7', [[0, 4, 7, 10], DOM]],
  ['maj7', [[0, 4, 7, 11], MAJ]], ['m7', [[0, 3, 7, 10], MIN]], ['6', [[0, 4, 7, 9], MAJ]],
  ['m6', [[0, 3, 7, 9], MIN]], ['9', [[0, 4, 7, 10, 14], DOM]], ['maj9', [[0, 4, 7, 11, 14], MAJ]],
  ['m9', [[0, 3, 7, 10, 14], MIN]], ['add9', [[0, 4, 7, 14], MAJ]], ['sus2', [[0, 2, 7], SUS]],
  ['sus4', [[0, 5, 7], SUS]], ['7sus4', [[0, 5, 7, 10], SUS]], ['dim', [[0, 3, 6], DIM]],
  ['dim7', [[0, 3, 6, 9], DIM]], ['m7b5', [[0, 3, 6, 10], HDIM]], ['aug', [[0, 4, 8], AUG]],
]);

const chordName = c => NOTES[c.r] + c.q;

const TUNING = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4

// ponytail: brute force over 4-fret windows with a rough playability heuristic; root-position only, no slash chords.
function guitarVoicings(root, q, max = 6) {
  const iv = QUALITIES.get(q)[0];
  const pcs = new Set(iv.map(i => (root + i) % 12));
  const fifth = (root + 7) % 12;
  const required = [...pcs].filter(p => !(iv.length > 3 && p === fifth)); // 5th is optional in 4+ note chords
  const best = new Map(); // position (+ open or not) -> best voicing there, so results spread up the neck
  for (let b = 1; b <= 12; b++) {
    const opts = TUNING.map(t => [-1, 0, b, b + 1, b + 2, b + 3]
      .filter(f => (f < 0 || pcs.has((t + f) % 12)) && (f !== 0 || b === 1))); // open strings only in open position
    const combos = opts.reduce((acc, o) => acc.flatMap(a => o.map(f => [...a, f])), [[]]);
    for (const frets of combos) {
      const v = rate(frets, root, required, fifth);
      const key = `${v?.pos}${frets.includes(0)}`;
      if (v && !(best.get(key)?.score <= v.score)) best.set(key, v);
    }
  }
  return [...best.values()].sort((a, b) => a.score - b.score).slice(0, max);
}

// Lower score = easier/fuller. null = unplayable or wrong chord.
function rate(frets, root, required, fifth) {
  const played = frets.flatMap((f, i) => (f >= 0 ? [i] : []));
  if (played.length < 4 || played.at(-1) - played[0] !== played.length - 1) return null; // 4+ adjacent strings
  const pcs = played.map(i => (TUNING[i] + frets[i]) % 12);
  if (pcs[0] !== root || !required.every(p => pcs.includes(p))) return null;
  const fretted = frets.filter(f => f > 0);
  const pos = fretted.length ? Math.min(...fretted) : 0;
  // one finger per run of adjacent strings on the same fret, above `min`
  const runs = min => frets.filter((f, i) => f > min && f !== frets[i - 1]).length;
  const sep = runs(0);
  const barre = fretted.filter(f => f === pos).length > 1 && !frets.slice(frets.indexOf(pos)).includes(0);
  const fingers = barre ? Math.min(sep, 1 + runs(pos)) : sep;
  if (fingers > 4) return null;
  const opens = frets.filter(f => f === 0).length;
  const score = (6 - played.length) * 1.5 + fingers + (fingers < sep ? 0.5 : 0) + pos * 0.4 - opens * 0.25 + (pcs.includes(fifth) ? 0 : 1);
  return { frets, pos, score };
}

const shape = frets => frets.map(f => (f < 0 ? 'x' : f)).join(frets.some(f => f > 9) ? '-' : '');

function pianoVoicings(root, q) {
  const iv = QUALITIES.get(q)[0];
  const up = v => [...v].sort((a, b) => a - b);
  const fit = v => { v = up(v); while (v[0] >= 65) v = v.map(n => n - 12); return v; }; // lowest note F3..E4
  const out = [];
  let v = iv.map(i => 60 + root + i);
  for (let k = 0; k < Math.min(iv.length, 4); k++) {
    out.push({ label: ['Root position', '1st inversion', '2nd inversion', '3rd inversion'][k], notes: fit(v) });
    v = up([...v.slice(1), v[0] + 12]);
  }
  if (iv.length >= 4) {
    const d = [...out[0].notes];
    d[d.length - 2] -= 12;
    out.push({ label: 'Drop 2', notes: fit(d) });
  }
  out.push({ label: 'Bass + chord', notes: [36 + root, ...out[1].notes] });
  return out;
}

if (typeof module === 'object') module.exports = { NOTES, QUALITIES, TUNING, chordName, guitarVoicings, pianoVoicings, shape };
