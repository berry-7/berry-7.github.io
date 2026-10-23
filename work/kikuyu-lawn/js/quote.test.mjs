import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalisePhone, validateQuote, buildMessage, waLink } from './quote.mjs';

const good = { name: 'Thandi', suburb: 'Faerie Glen', size: 'standard', phone: '082 123 4567' };

test('a complete form passes', () => {
  assert.deepEqual(validateQuote(good), { ok: true, errors: {} });
});

test('phone numbers normalise however they are typed', () => {
  assert.equal(normalisePhone('+27 82 123 4567'), '0821234567');
  assert.equal(normalisePhone('27821234567'), '0821234567');
  assert.equal(normalisePhone('(082) 123-4567'), '0821234567');
});

test('landlines and short numbers are rejected: the crew confirms by cell', () => {
  assert.ok(validateQuote({ ...good, phone: '012 345 6789' }).errors.phone);
  assert.ok(validateQuote({ ...good, phone: '082 123' }).errors.phone);
});

test('every missing field is reported at once', () => {
  const { ok, errors } = validateQuote({});
  assert.equal(ok, false);
  assert.deepEqual(Object.keys(errors).sort(), ['name', 'phone', 'size', 'suburb']);
});

test('unknown suburbs are refused, "other" is allowed', () => {
  assert.ok(validateQuote({ ...good, suburb: 'Sandton' }).errors.suburb);
  assert.equal(validateQuote({ ...good, suburb: 'other' }).ok, true);
});

test('unknown yard sizes are refused', () => {
  assert.ok(validateQuote({ ...good, size: 'huge' }).errors.size);
});

test('the WhatsApp message carries every field, readably', () => {
  const m = buildMessage(good);
  assert.match(m, /Faerie Glen/);
  assert.match(m, /300 to 800/);
  assert.match(m, /0821234567/);
  assert.match(buildMessage({ ...good, suburb: 'other' }), /near Pretoria East/);
});

test('the link is encoded so newlines and ampersands survive', () => {
  const l = waLink('27000000000', 'a & b\nc');
  assert.equal(l, 'https://wa.me/27000000000?text=a%20%26%20b%0Ac');
});
