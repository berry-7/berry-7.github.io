import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalisePhone, validateCallback, buildMessage, waLink } from './quote.mjs';

const good = { name: 'Nomsa', suburb: 'Benoni', problem: 'geyser', phone: '082 123 4567' };

test('a complete form passes', () => {
  assert.deepEqual(validateCallback(good), { ok: true, errors: {} });
});

test('numbers normalise however they are typed', () => {
  assert.equal(normalisePhone('+27 82 123 4567'), '0821234567');
  assert.equal(normalisePhone('27821234567'), '0821234567');
  assert.equal(normalisePhone('(011) 421-0000'), '0114210000');
});

test('landlines are accepted, short numbers are not', () => {
  assert.equal(validateCallback({ ...good, phone: '011 421 0000' }).ok, true);
  assert.ok(validateCallback({ ...good, phone: '082 123' }).errors.phone);
});

test('every missing field is reported at once', () => {
  const { ok, errors } = validateCallback({});
  assert.equal(ok, false);
  assert.deepEqual(Object.keys(errors).sort(), ['name', 'phone', 'problem', 'suburb']);
});

test('areas outside the list are refused, "other" is allowed', () => {
  assert.ok(validateCallback({ ...good, suburb: 'Sandton' }).errors.suburb);
  assert.equal(validateCallback({ ...good, suburb: 'other' }).ok, true);
});

test('unknown problems are refused', () => {
  assert.ok(validateCallback({ ...good, problem: 'roof' }).errors.problem);
});

test('the message carries every field, readably', () => {
  const m = buildMessage(good);
  assert.match(m, /Benoni/);
  assert.match(m, /Geyser/);
  assert.match(m, /0821234567/);
  assert.match(buildMessage({ ...good, suburb: 'other' }), /near the East Rand/);
});

test('the link is encoded so newlines and ampersands survive', () => {
  assert.equal(waLink('27000000000', 'a & b\nc'), 'https://wa.me/27000000000?text=a%20%26%20b%0Ac');
});

test('the optional note is carried when present and left out when blank', () => {
  assert.match(buildMessage({ ...good, note: 'Started at 2am' }), /Note: Started at 2am/);
  assert.doesNotMatch(buildMessage({ ...good, note: '   ' }), /Note:/);
});
