
import { validateCallback as validateQuote, buildMessage, waLink } from './quote.mjs';

const form = document.getElementById('bookForm');
const done = document.getElementById('formDone');
const FIELDS = ['name', 'suburb', 'problem', 'phone'];

function read() {
  const d = new FormData(form);
  return { ...Object.fromEntries(FIELDS.map((k) => [k, d.get(k) || ''])), note: d.get('note') || '' };
}

function show(errors) {
  FIELDS.forEach((k) => {
    const msg = errors[k] || '';
    document.getElementById('e-' + k).textContent = msg;
    form.querySelectorAll(`[name="${k}"]`).forEach((el) => {
      if (msg) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
      el.setAttribute('aria-describedby', 'e-' + k);
    });
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const fields = read();
  const { ok, errors } = validateQuote(fields);
  show(errors);
  if (!ok) {
    const first = FIELDS.find((k) => errors[k]);
    form.querySelector(`[name="${first}"]`).focus();
    return;
  }
  window.open(waLink(document.body.dataset.wa, buildMessage(fields)), '_blank', 'noopener');
  done.textContent = 'WhatsApp is open with your details. Press send there and we call you back, usually within the hour.';
});
form.addEventListener('input', (e) => {
  const k = e.target.name;
  const slot = k && document.getElementById('e-' + k);
  if (!slot || !slot.textContent || validateQuote(read()).errors[k]) return;
  slot.textContent = '';
  form.querySelectorAll(`[name="${k}"]`).forEach((el) => el.removeAttribute('aria-invalid'));
});
