/* Callback form rules. Pure: no DOM, no network, no side effects, so it can
   be tested with `node --test js/quote.test.mjs` and reused anywhere.
   Same shape as templates/kikuyu/js/quote.mjs. */

export const AREAS = [
  'Benoni', 'Boksburg', 'Kempton Park', 'Brakpan',
  'Germiston', 'Edenvale', 'Bedfordview'
];

export const PROBLEMS = {
  geyser: 'Geyser',
  drain: 'Blocked drain',
  leak: 'Leak',
  bathroom: 'Bathroom refit',
  other: 'Something else'
};

/* South African numbers, however people actually type them. */
export function normalisePhone(raw) {
  let n = String(raw || '').replace(/[\s().-]/g, '');
  if (n.startsWith('+27')) n = '0' + n.slice(3);
  else if (n.startsWith('27') && n.length === 11) n = '0' + n.slice(2);
  return n;
}

export function validateCallback(fields) {
  const f = fields || {};
  const errors = {};

  if (!String(f.name || '').trim()) errors.name = 'Please tell us your name.';

  const area = String(f.suburb || '').trim();
  if (!area) errors.suburb = 'Please choose your area.';
  else if (area !== 'other' && !AREAS.includes(area)) errors.suburb = 'Please choose one of the areas in the list.';

  if (!PROBLEMS[f.problem]) errors.problem = 'Please pick what is closest.';

  /* Landlines are fine here: a callback can go to the office number. */
  if (!/^0[1-8]\d{8}$/.test(normalisePhone(f.phone))) {
    errors.phone = 'That does not look like a South African number. Try 082 123 4567.';
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function buildMessage(f) {
  const where = f.suburb === 'other' ? 'near the East Rand' : f.suburb;
  return [
    'Hi Stopcock, please call me back.',
    `Name: ${String(f.name).trim()}`,
    `Area: ${where}`,
    `Problem: ${PROBLEMS[f.problem]}`,
    `Number: ${normalisePhone(f.phone)}`,
    ...(String(f.note || '').trim() ? [`Note: ${String(f.note).trim()}`] : [])
  ].join('\n');
}

export function waLink(number, message) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
