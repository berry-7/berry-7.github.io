import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOrderMessage, buildOrderUrl } from "./order.mjs";

test("lists each item with quantity and line total", () => {
  const msg = buildOrderMessage({
    items: [{ name: "Milk tart, whole", qty: 2, price: 180 }],
    slot: "Saturday 20 September, 9am",
    name: "Thabo"
  });
  assert.match(msg, /2 x Milk tart, whole/);
  assert.match(msg, /R360/);
  assert.match(msg, /Saturday 20 September, 9am/);
  assert.match(msg, /Thabo/);
});

test("totals across several items", () => {
  const msg = buildOrderMessage({
    items: [
      { name: "Koeksisters, dozen", qty: 1, price: 120 },
      { name: "Buttermilk rusks, 500g", qty: 3, price: 95 }
    ],
    slot: "Wednesday 17 September, 4pm",
    name: ""
  });
  assert.match(msg, /R405/);          // 120 + 285
});

test("drops zero-quantity items", () => {
  const msg = buildOrderMessage({
    items: [
      { name: "Milk tart, whole", qty: 0, price: 180 },
      { name: "Carrot cake, whole", qty: 1, price: 240 }
    ],
    slot: "Saturday", name: ""
  });
  assert.doesNotMatch(msg, /Milk tart/);
  assert.match(msg, /R240/);
});

test("says so when nothing is selected", () => {
  const msg = buildOrderMessage({ items: [], slot: "Saturday", name: "" });
  assert.match(msg, /nothing selected/i);
});

test("url-encodes newlines and punctuation", () => {
  const url = buildOrderUrl({
    items: [{ name: "Malva pudding tray, serves 8", qty: 1, price: 160 }],
    slot: "Saturday 20 September, 9am",
    name: "Zanele"
  });
  assert.ok(url.startsWith("https://wa.me/27760825924?text="));
  assert.ok(!url.includes("\n"), "raw newline must not survive encoding");
  assert.ok(!url.includes(" "), "raw space must not survive encoding");
  assert.match(url, /%0A/);
});
