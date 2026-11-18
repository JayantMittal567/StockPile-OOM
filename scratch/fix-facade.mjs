import fs from 'node:fs';
const p = 'C:/Users/Pratik/Desktop/GitHub/StockPile-OOM/backend/src/main/java/com/stockpile/StockpileService.java';
let c = fs.readFileSync(p, 'utf8');
const svcs = ['Product', 'Supplier', 'Inventory', 'Dashboard', 'Intelligence', 'Sales', 'PurchaseOrder', 'StockAudit', 'Report', 'Expense', 'Surplus'];
let n = 0;
for (const s of svcs) {
  const f = s.charAt(0).toLowerCase() + s.slice(1);
  const re = new RegExp('\\b' + f + '\\.', 'g');
  c = c.replace(re, () => { n++; return f + 'Service.'; });
}
c = c.replace('import java.util.List;', 'import java.util.*;');
fs.writeFileSync(p, c);
console.log('replacements:', n);