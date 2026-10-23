export const WHATSAPP = "27760825924";

export function buildOrderMessage({ items, slot, name }) {
  const chosen = (items || []).filter(i => i.qty > 0);
  const lines = ["Hi Naledi, I'd like to order:"];

  if (!chosen.length) {
    lines.push("(nothing selected yet)");
  } else {
    for (const i of chosen) {
      lines.push(`${i.qty} x ${i.name} - R${i.qty * i.price}`);
    }
    const total = chosen.reduce((s, i) => s + i.qty * i.price, 0);
    lines.push(`Total: R${total}`);
  }

  lines.push(`Collection: ${slot}`);
  if (name && name.trim()) lines.push(`Name: ${name.trim()}`);
  return lines.join("\n");
}

export function buildOrderUrl(state) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(buildOrderMessage(state))}`;
}
