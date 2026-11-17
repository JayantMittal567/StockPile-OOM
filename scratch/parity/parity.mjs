const OLD = 'http://localhost:8081/api';
const NEW = 'http://localhost:8082/api';

const canon = (v, strip) => {
  if (Array.isArray(v)) return v.map((x) => canon(x, strip));
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) {
      if (strip(k)) continue;
      o[k] = canon(v[k], strip);
    }
    return o;
  }
  return v;
};
const strictStrip = (k) => k === 'generatedAt' || k === 'timestamp';
const writeStrip = (k) => strictStrip(k) || /At$/.test(k);

async function req(base, method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
}

const GETS = [
  '/health', '/products', '/products?search=ear&category=Electronics', '/products/1', '/products/2',
  '/products/1/movements', '/movements', '/movements?productId=2&movementType=IN&from=2026-01-01&to=2026-12-31&limit=5&offset=0',
  '/movements?page=0&size=3', '/dashboard', '/dashboard?period=MONTHLY', '/dashboard?period=YEARLY',
  '/dashboard?period=CUSTOM&from=2026-11-01&to=2026-11-17', '/intelligence', '/intelligence/sales',
  '/sales', '/sales?status=COMPLETED&limit=10', '/sales?status=CANCELLED', '/sales/summary', '/sales/trend', '/sales/1', '/sales/2',
  '/suppliers', '/suppliers?search=a', '/suppliers/1', '/suppliers/1/products',
  '/purchase-orders', '/purchase-orders?status=RECEIVED', '/purchase-orders?supplierId=1', '/purchase-orders/1',
  '/stock-audits/summary', '/stock-audits', '/stock-audits?status=COMPLETED', '/stock-audits/1',
  '/reports/summary?period=MONTHLY&month=11&year=2026', '/reports/summary?period=TODAY',
  '/reports/profit-loss?period=YEARLY&year=2026', '/reports/profit-loss?period=MONTHLY&month=11&year=2026',
  '/reports/sales?period=DAILY&date=2026-11-10', '/reports/sales?period=MONTHLY&month=11&year=2026',
  '/reports/inventory-loss?period=MONTHLY&month=11&year=2026', '/reports/purchases?period=MONTHLY&month=11&year=2026',
  '/reports/purchases?period=YEARLY&year=2026',
  '/expenses', '/expenses?category=Rent&limit=5',
  '/surplus-listings/suggestions', '/surplus-listings/summary', '/surplus-listings', '/surplus-listings?status=SOLD',
  '/surplus-listings?status=ACTIVE', '/surplus-listings/1',
];

let fails = 0;
const compare = (label, a, b, strip) => {
  const sa = JSON.stringify(canon(a.json, strip));
  const sb = JSON.stringify(canon(b.json, strip));
  const ok = a.status === b.status && sa === sb;
  if (!ok) {
    fails++;
    console.log('DIFF', label, 'status', a.status, b.status);
    console.log('  old:', sa.slice(0, 400));
    console.log('  new:', sb.slice(0, 400));
  } else console.log('ok  ', label, a.status);
  return ok;
};

async function waitUp() {
  for (let i = 0; i < 60; i++) {
    try {
      const a = await req(OLD, 'GET', '/health');
      const b = await req(NEW, 'GET', '/health');
      if (a.status === 200 && b.status === 200) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('servers did not come up');
}

await waitUp();
console.log('--- GET parity ---');
for (const g of GETS) {
  const a = await req(OLD, 'GET', g);
  const b = await req(NEW, 'GET', g);
  compare('GET ' + g, a, b, strictStrip);
}

console.log('--- WRITE parity ---');
const p1old = (await req(OLD, 'GET', '/products/1')).json;
const p1new = (await req(NEW, 'GET', '/products/1')).json;
const qty = p1old.quantity;
if (qty !== p1new.quantity) { console.log('DB copies diverge at start!'); process.exit(1); }

const steps = [
  ['POST', '/inventory/stock-in', { productId: 1, quantity: 5, reason: 'parity check' }],
  ['POST', '/inventory/adjust', { productId: 1, quantity: qty + 5, reason: 'parity same-qty rejection' }],
  ['POST', '/inventory/adjust', { productId: 1, quantity: qty + 7, reason: 'parity adjust' }],
  ['POST', '/inventory/stock-out', { productId: 1, quantity: 2, reason: 'parity out' }],
  ['POST', '/sales', { items: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }], discountPaise: 500, paymentMethod: 'UPI' }],
];
let saleId = null;
for (const [m, p, body] of steps) {
  const a = await req(OLD, m, p, body);
  const b = await req(NEW, m, p, body);
  compare(m + ' ' + p, a, b, writeStrip);
  if (p === '/sales' && a.status === 201) saleId = a.json.id;
}
if (saleId) {
  const a = await req(OLD, 'POST', `/sales/${saleId}/cancel`, { reason: 'parity cancel' });
  const b = await req(NEW, 'POST', `/sales/${saleId}/cancel`, { reason: 'parity cancel' });
  compare('POST /sales/{id}/cancel', a, b, writeStrip);
}
const surBody = { productId: 2, quantity: 3, discountedPricePaise: 1000, reason: 'parity clearance' };
const sa = await req(OLD, 'POST', '/surplus-listings', surBody);
const sb = await req(NEW, 'POST', '/surplus-listings', surBody);
compare('POST /surplus-listings', sa, sb, writeStrip);
const lid = sa.json?.id;
if (lid) {
  for (const [m, p, body] of [
    ['POST', `/surplus-listings/${lid}/sell`, { quantity: 1, paymentMethod: 'CASH' }],
    ['PUT', `/surplus-listings/${lid}`, { discountedPricePaise: 900, reason: 'parity reprice' }],
    ['POST', `/surplus-listings/${lid}/cancel`, { reason: 'parity cancel' }],
  ]) {
    const a = await req(OLD, m, p, body);
    const b = await req(NEW, m, p, body);
    compare(m + ' ' + p, a, b, writeStrip);
  }
}
const ea = await req(OLD, 'POST', '/expenses', { category: 'Rent', amountPaise: 12345, description: 'parity', date: '2026-11-15' });
const eb = await req(NEW, 'POST', '/expenses', { category: 'Rent', amountPaise: 12345, description: 'parity', date: '2026-11-15' });
compare('POST /expenses', ea, eb, writeStrip);
if (ea.json?.id) {
  const a = await req(OLD, 'DELETE', `/expenses/${ea.json.id}`);
  const b = await req(NEW, 'DELETE', `/expenses/${eb.json.id}`);
  compare('DELETE /expenses/{id}', a, b, writeStrip);
}
for (const [m, p, body] of [
  ['PUT', '/products/1/supplier', { supplierId: 1 }],
  ['DELETE', '/products/1/supplier', null],
  ['POST', '/purchase-orders', { supplierId: 1, items: [{ productId: 1, quantity: 4, unitCostPaise: 100 }], notes: 'parity' }],
]) {
  const a = await req(OLD, m, p, body);
  const b = await req(NEW, m, p, body);
  compare(m + ' ' + p, a, b, writeStrip);
  if (p === '/purchase-orders' && a.status === 201) {
    const id = a.json.id;
    for (const [m2, p2, body2] of [
      ['POST', `/purchase-orders/${id}/place`, null],
      ['POST', `/purchase-orders/${id}/receive`, { items: [{ purchaseOrderItemId: a.json.items[0].id, quantity: 4 }] }],
    ]) {
      const a2 = await req(OLD, m2, p2, body2);
      const b2 = await req(NEW, m2, p2, body2);
      compare(m2 + ' ' + p2, a2, b2, writeStrip);
    }
  }
}
console.log('--- post-write state parity ---');
for (const g of ['/products', '/products/1', '/movements?limit=20', '/sales?limit=10', '/surplus-listings', '/expenses', '/purchase-orders', '/dashboard', '/reports/summary?period=MONTHLY&month=11&year=2026', '/surplus-listings/summary', '/sales/summary']) {
  const a = await req(OLD, 'GET', g);
  const b = await req(NEW, 'GET', g);
  compare('GET ' + g, a, b, strictStrip);
}
console.log(fails === 0 ? 'PARITY PASS: all responses identical' : `PARITY FAIL: ${fails} diffs`);
process.exit(fails === 0 ? 0 : 1);