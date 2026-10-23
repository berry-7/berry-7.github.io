/* Yard-check form rules. Pure: no DOM, no network, no side effects, so it
   can be tested with `node --test js/` and reused anywhere. Adapted from
   templates/marula-stone/js/quote.mjs. */

export const SUBURBS = [
  'Faerie Glen', 'Moreleta Park', 'Garsfontein', 'Lynnwood',
  'Menlo Park', 'Waterkloof', 'Silver Lakes', 'Woodhill'
];

export const SIZES = {
  small: 'Small (under 300 m²)',
  standard: 'Standard (300 to 800 m²)',
  large: 'Larger (over 800 m²)'
};

/* South African numbers, however people actually type them:
   spaces, dashes, brackets, +27 or a leading 0. */
export function normalisePhone(raw) {
  let n = String(raw || '').replace(/[\s().-]/g, '');
  if (n.startsWith('+27')) n = '0' + n.slice(3);
  else if (n.startsWith('27') && n.length === 11) n = '0' + n.slice(2);
  return n;
}

export function validateQuote(fields) {
  const f = fields || {};
  const errors = {};

  if (!String(f.name || '').trim()) errors.name = 'Please tell us your name.';

  const suburb = String(f.suburb || '').trim();
  if (!suburb) errors.suburb = 'Please choose your suburb.';
  else if (suburb !== 'other' && !SUBURBS.includes(suburb)) errors.suburb = 'Please choose one of the suburbs in the list.';

  if (!SIZES[f.size]) errors.size = 'Please pick the closest yard size.';

  if (!/^0[6-8]\d{8}$/.test(normalisePhone(f.phone))) {
    errors.phone = 'That does not look like a South African cell number. Try 082 123 4567.';
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/* The message the customer sees in WhatsApp before they press send. */
export function buildMessage(f) {
  const where = f.suburb === 'other' ? 'a suburb near Pretoria East' : f.suburb;
  return [
    `Hi Kikuyu, I'd like a free yard check.`,
    `Name: ${String(f.name).trim()}`,
    `Suburb: ${where}`,
    `Yard: ${SIZES[f.size]}`,
    `Cell: ${normalisePhone(f.phone)}`
  ].join('\n');
}

export function waLink(number, message) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
