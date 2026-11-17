import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:/Users/Pratik/Desktop/GitHub/StockPile-OOM/backend';
const SRC = path.join(ROOT, 'src/main/java/com/stockpile');
const lines = fs.readFileSync(path.join(SRC, 'StockpileService.java'), 'utf8').split(/\r?\n/);

// [startLine(1-based), target, optionalRename]
const M = [
  [35, 'skip'], [37, 'Supplier'], [39, 'rowmappers', 'PRODUCT'], [57, 'rowmappers', 'SUPPLIER'],
  [69, 'query'], [78, 'rowmappers', 'MOVEMENT'], [90, 'skip'], [94, 'facade'], [170, 'facade'],
  [200, 'Product'], [231, 'Product'], [250, 'Product'], [344, 'Product'], [419, 'Product'],
  [477, 'Inventory'], [570, 'Inventory'], [574, 'Inventory'],
  [628, 'Dashboard'], [632, 'Dashboard'],
  [906, 'Intelligence'], [967, 'Intelligence'], [1164, 'Intelligence'],
  [1190, 'Sales'], [1387, 'Sales'], [1433, 'Sales'], [1504, 'Sales'], [1546, 'Sales'], [1565, 'Sales'], [1654, 'Sales'],
  [1740, 'Supplier'], [1746, 'Supplier'], [1761, 'Supplier'], [1781, 'Supplier'], [1796, 'Supplier'], [1819, 'Supplier'], [1844, 'Supplier'],
  [1873, 'Product'], [1891, 'Product'], [1900, 'Product'],
  [1934, 'rowmappers', 'PO_ITEM'], [1951, 'rowmappers', 'PO_SUMMARY'],
  [1969, 'PurchaseOrder'], [2036, 'PurchaseOrder'], [2040, 'PurchaseOrder'], [2099, 'PurchaseOrder'],
  [2161, 'PurchaseOrder'], [2239, 'PurchaseOrder'], [2258, 'PurchaseOrder'], [2361, 'PurchaseOrder'],
  [2386, 'StockAudit'], [2435, 'StockAudit'], [2510, 'StockAudit'], [2514, 'StockAudit'], [2518, 'StockAudit'],
  [2589, 'StockAudit'], [2676, 'StockAudit'], [2712, 'StockAudit'], [2755, 'StockAudit'], [2868, 'StockAudit'],
  [2897, 'Report'], [2984, 'query'], [2995, 'Report'], [3001, 'Report'], [3107, 'Report'],
  [3253, 'Report'], [3271, 'Report'], [3305, 'Report'], [3338, 'Report'], [3407, 'Report'],
  [3447, 'Report'], [3485, 'Report'], [3530, 'Report'], [3570, 'Report'], [3599, 'Report'],
  [3629, 'Expense'], [3669, 'Expense'], [3712, 'Expense'], [3720, 'Expense'], [3724, 'Expense'],
  [3777, 'Inventory'],
  [3787, 'Surplus'], [3875, 'Surplus'], [3936, 'Surplus'], [3940, 'Surplus'], [3994, 'Surplus'],
  [4047, 'Surplus'], [4105, 'Surplus'], [4177, 'Surplus'], [4269, 'Surplus'], [4330, 'Surplus'],
  [4365, 'model'], [4374, 'model'], [4410, 'model'], [4439, 'model'], [4451, 'model'], [4458, 'model'],
  [4470, 'model'], [4476, 'model'], [4487, 'model'], [4500, 'model'], [4515, 'model'], [4541, 'model'],
  [4559, 'exception'], [4565, 'exception'],
  [4571, 'model'], [4598, 'model'], [4608, 'model'], [4621, 'model'], [4625, 'model'], [4661, 'model'], [4747, 'model'],
  [4793, 'exception'], [4799, 'exception'],
  [4805, 'model'], [4817, 'model'], [4826, 'model'], [4835, 'model'], [4839, 'model'],
  [4855, 'exception'], [4861, 'exception'],
  [4867, 'model'], [4873, 'model'], [4879, 'model'], [4885, 'model'], [4890, 'model'], [4894, 'model'],
  [4898, 'model'], [4916, 'model'], [4929, 'model'],
  [4946, 'exception'], [4952, 'exception'],
  [4958, 'model'], [4977, 'model'], [4987, 'model'], [4992, 'model'], [5003, 'model'],
  [5011, 'model'], [5016, 'model'], [5021, 'model'], [5025, 'model'], [5032, 'model'], [5046, 'model'],
  [5060, 'model'], [5075, 'model'], [5091, 'StockAudit'],
  [5101, 'exception'], [5107, 'exception'],
  [5115, 'model'], [5123, 'model'], [5131, 'model'], [5145, 'model'], [5168, 'model'], [5189, 'model'],
  [5195, 'model'], [5206, 'model'], [5227, 'model'], [5239, 'model'], [5253, 'model'], [5260, 'model'],
  [5277, 'model'], [5288, 'model'],
  [5296, 'Report'], [5305, 'Report'], [5311, 'Report'], [5316, 'Report'], [5333, 'Report'], [5345, 'Report'], [5359, 'Report'],
  [5372, 'model'], [5390, 'model'], [5402, 'model'], [5413, 'model'], [5417, 'model'], [5426, 'model'],
  [5443, 'model'], [5500, 'model'],
  [5526, 'exception'], [5532, 'exception'],
];

const blocks = [];
let pending = [];
for (let i = 0; i < M.length; i++) {
  const [start, target, rename] = M[i];
  const end = i + 1 < M.length ? M[i + 1][0] - 1 : 5536;
  let b = lines.slice(start - 1, end);
  while (b.length && b[b.length - 1].trim() === '') b.pop();
  const tail = [];
  while (b.length && /^\s*\/\//.test(b[b.length - 1])) tail.unshift(b.pop());
  while (b.length && b[b.length - 1].trim() === '') b.pop();
  blocks.push({ start, target, rename, text: [...pending, ...b].join('\n') });
  pending = tail;
}

const nameOf = (b) => {
  const m = b.text.match(/(?:record|class)\s+(\w+)/);
  return m ? m[1] : null;
};

const JAVA_IMPORTS = lines.slice(8, 30).join('\n'); // java.* imports of original

const IMPORT_TOKENS = {
  BigDecimal: 'java.math.BigDecimal', RoundingMode: 'java.math.RoundingMode',
  DayOfWeek: 'java.time.DayOfWeek', Duration: 'java.time.Duration', Instant: 'java.time.Instant',
  LocalDate: 'java.time.LocalDate', LocalDateTime: 'java.time.LocalDateTime', YearMonth: 'java.time.YearMonth',
  ZoneId: 'java.time.ZoneId', ZoneOffset: 'java.time.ZoneOffset', ZonedDateTime: 'java.time.ZonedDateTime',
  DateTimeFormatter: 'java.time.format.DateTimeFormatter', ChronoUnit: 'java.time.temporal.ChronoUnit',
  TemporalAdjusters: 'java.time.temporal.TemporalAdjusters', ArrayList: 'java.util.ArrayList',
  HashMap: 'java.util.HashMap', HashSet: 'java.util.HashSet', LinkedHashMap: 'java.util.LinkedHashMap',
  List: 'java.util.List', Map: 'java.util.Map', Set: 'java.util.Set', Pattern: 'java.util.regex.Pattern',
};
const importsFor = (text) => Object.entries(IMPORT_TOKENS)
  .filter(([tok]) => new RegExp(`\\b${tok}\\b`).test(text))
  .map(([, imp]) => `import ${imp};`).join('\n');

const dedent = (t) => t.split('\n').map((l) => (l.startsWith('    ') ? l.slice(4) : l)).join('\n');

const mkdir = (p) => fs.mkdirSync(p, { recursive: true });
const write = (p, c) => { fs.writeFileSync(p, c.endsWith('\n') ? c : c + '\n'); console.log('wrote', path.relative(ROOT, p), c.split('\n').length, 'lines'); };

mkdir(path.join(SRC, 'model'));
mkdir(path.join(SRC, 'exception'));
mkdir(path.join(SRC, 'service', 'support'));

// ---- model & exception files ----
for (const b of blocks) {
  if (b.target !== 'model' && b.target !== 'exception') continue;
  const name = nameOf(b);
  let body = dedent(b.text);
  if (b.target === 'exception') body = body.replace('public static class', 'public class');
  const imports = b.target === 'model' ? importsFor(body) : '';
  const pkg = b.target === 'model' ? 'model' : 'exception';
  write(path.join(SRC, pkg, name + '.java'),
    `package com.stockpile.${pkg};\n\n${imports ? imports + '\n\n' : ''}${body}\n`);
}

// ---- support: QuerySupport ----
const qHas = blocks.find((b) => b.start === 69).text.replace('private static boolean hasColumn', 'public static boolean hasColumn');
const qParse = blocks.find((b) => b.start === 2984).text.replace('private LocalDate parseIsoDate', 'public static LocalDate parseIsoDate');
write(path.join(SRC, 'service', 'support', 'QuerySupport.java'),
  `package com.stockpile.service.support;\n\nimport java.time.LocalDate;\nimport java.time.format.DateTimeFormatter;\n\npublic final class QuerySupport {\n\n    private QuerySupport() {}\n\n${qHas}\n\n${qParse}\n}\n`);

// ---- support: RowMappers ----
const mapperBlocks = blocks.filter((b) => b.target === 'rowmappers').map((b) => {
  const oldName = b.text.match(/RowMapper<\w+>\s+(\w+)\s*=/)[1];
  return b.text
    .replace(`private final RowMapper<`, `public static final RowMapper<`)
    .replace(new RegExp(`>\\s+${oldName}\\s*=`), `> ${b.rename} =`)
    .replace(/hasColumn\(/g, 'QuerySupport.hasColumn(');
});
write(path.join(SRC, 'service', 'support', 'RowMappers.java'),
  `package com.stockpile.service.support;\n\nimport com.stockpile.model.*;\nimport org.springframework.jdbc.core.RowMapper;\n\npublic final class RowMappers {\n\n    private RowMappers() {}\n\n${mapperBlocks.join('\n\n')}\n}\n`);

// ---- domain services ----
const DEPS = {
  Product: ['SupplierService'],
  Supplier: [],
  Inventory: ['ProductService'],
  Dashboard: [],
  Intelligence: ['ProductService'],
  Sales: ['ProductService', 'InventoryService'],
  PurchaseOrder: ['ProductService', 'SupplierService'],
  StockAudit: ['ProductService', 'InventoryService'],
  Report: [],
  Expense: [],
  Surplus: ['ProductService', 'InventoryService', 'SalesService', 'IntelligenceService'],
};
const fieldOf = (svc) => svc.charAt(0).toLowerCase() + svc.slice(1);
const COMMON_REPL = [
  [/hasColumn\(/g, 'QuerySupport.hasColumn('],
  [/parseIsoDate\(/g, 'QuerySupport.parseIsoDate('],
  [/\bproductRowMapper\b/g, 'RowMappers.PRODUCT'],
  [/\bsupplierRowMapper\b/g, 'RowMappers.SUPPLIER'],
  [/\brecentMovementRowMapper\b/g, 'RowMappers.MOVEMENT'],
  [/\bpoItemRowMapper\b/g, 'RowMappers.PO_ITEM'],
  [/\bpoSummaryRowMapper\b/g, 'RowMappers.PO_SUMMARY'],
];
const EXTRA_REPL = {
  Product: [[/getSupplierById\(/g, 'supplierService.getSupplierById(']],
  Inventory: [[/getProductById\(/g, 'productService.getProductById(']],
  Sales: [[/getProductById\(/g, 'productService.getProductById('], [/getActiveReservedQuantity\(/g, 'inventoryService.getActiveReservedQuantity(']],
  Intelligence: [[/getProducts\(/g, 'productService.getProducts(']],
  PurchaseOrder: [[/getProductById\(/g, 'productService.getProductById('], [/getSupplierById\(/g, 'supplierService.getSupplierById(']],
  StockAudit: [[/getProductById\(/g, 'productService.getProductById('], [/getActiveReservedQuantity\(/g, 'inventoryService.getActiveReservedQuantity(']],
  Surplus: [
    [/getProductById\(/g, 'productService.getProductById('],
    [/getActiveReservedQuantity\(/g, 'inventoryService.getActiveReservedQuantity('],
    [/getProducts\(/g, 'productService.getProducts('],
    [/getSaleById\(/g, 'salesService.getSaleById('],
    [/getSalesIntelligence\(/g, 'intelligenceService.getSalesIntelligence('],
  ],
};
const applyRepl = (text, repls) => text.split('\n').map((l) => {
  if (/^\s*(public|private|protected|@)/.test(l)) return l;
  let out = l;
  for (const [re, rep] of repls) out = out.replace(re, rep);
  return out;
}).join('\n');

const facadeDelegates = [];
for (const svc of Object.keys(DEPS)) {
  const own = blocks.filter((b) => b.target === svc);
  const repls = [...COMMON_REPL, ...(EXTRA_REPL[svc] || [])];
  const body = own.map((b) => applyRepl(b.text, repls)).join('\n\n');
  const deps = DEPS[svc];
  const fields = ['    private final JdbcTemplate jdbcTemplate;',
    ...deps.map((d) => `    private final ${d} ${fieldOf(d)};`)].join('\n');
  const ctorParams = ['JdbcTemplate jdbcTemplate', ...deps.map((d) => `${d} ${fieldOf(d)}`)].join(', ');
  const ctorAssign = ['        this.jdbcTemplate = jdbcTemplate;',
    ...deps.map((d) => `        this.${fieldOf(d)} = ${fieldOf(d)};`)].join('\n');
  write(path.join(SRC, 'service', svc + 'Service.java'),
    `package com.stockpile.service;\n\nimport com.stockpile.model.*;\nimport com.stockpile.exception.*;\nimport com.stockpile.service.support.QuerySupport;\nimport com.stockpile.service.support.RowMappers;\nimport org.springframework.jdbc.core.JdbcTemplate;\nimport org.springframework.stereotype.Service;\nimport org.springframework.transaction.annotation.Transactional;\n\n${JAVA_IMPORTS}\n\n@Service\npublic class ${svc}Service {\n\n${fields}\n\n    public ${svc}Service(${ctorParams}) {\n${ctorAssign}\n    }\n\n${body}\n}\n`);
  for (const b of own) {
    const decl = b.text.split('\n').find((l) => /^    public /.test(l));
    if (!decl) continue;
    const m = decl.match(/^    public (.+?) (\w+)\((.*)\) \{\s*$/);
    if (!m) { console.log('!! unparsed signature', svc, decl); continue; }
    const [, ret, name, params] = m;
    const args = params.trim() ? params.split(',').map((p) => p.trim().split(/\s+/).pop()) : [];
    facadeDelegates.push({ svc, ret, name, params, args });
  }
}

// ---- facade ----
const facadeReal = blocks.filter((b) => b.target === 'facade').map((b) => b.text).join('\n\n');
const allServices = Object.keys(DEPS).map((s) => s + 'Service');
const fFields = ['    private final JdbcTemplate jdbcTemplate;',
  ...allServices.map((d) => `    private final ${d} ${fieldOf(d)};`)].join('\n');
const fParams = ['JdbcTemplate jdbcTemplate', ...allServices.map((d) => `${d} ${fieldOf(d)}`)].join(', ');
const fAssign = ['        this.jdbcTemplate = jdbcTemplate;',
  ...allServices.map((d) => `        this.${fieldOf(d)} = ${fieldOf(d)};`)].join('\n');
const delegates = facadeDelegates.map((d) => {
  const call = `${fieldOf(d.svc)}.${d.name}(${d.args.join(', ')});`;
  const stmt = d.ret === 'void' ? `        ${call}` : `        return ${call}`;
  return `    public ${d.ret} ${d.name}(${d.params}) {\n${stmt}\n    }`;
}).join('\n\n');
write(path.join(SRC, 'StockpileService.java'),
  `package com.stockpile;\n\nimport com.stockpile.exception.*;\nimport com.stockpile.model.*;\nimport com.stockpile.service.*;\nimport jakarta.annotation.PostConstruct;\nimport org.springframework.jdbc.core.JdbcTemplate;\nimport org.springframework.stereotype.Service;\n\nimport java.time.Instant;\nimport java.util.List;\n\n@Service\npublic class StockpileService {\n\n${fFields}\n\n    public StockpileService(${fParams}) {\n${fAssign}\n    }\n\n${facadeReal}\n\n${delegates}\n}\n`);

// ---- controller + tests rewire ----
const rewire = (p) => {
  let c = fs.readFileSync(p, 'utf8');
  const n = (c.match(/StockpileService\./g) || []).length;
  c = c.replace(/StockpileService\./g, '');
  c = c.replace(/^(package com\.stockpile;\n)/, `$1\nimport com.stockpile.exception.*;\nimport com.stockpile.model.*;\n`);
  fs.writeFileSync(p, c);
  console.log('rewired', path.relative(ROOT, p), n, 'qualifiers');
};
rewire(path.join(SRC, 'StockpileController.java'));
for (const f of fs.readdirSync(path.join(ROOT, 'src/test/java/com/stockpile'))) {
  if (f.endsWith('.java')) rewire(path.join(ROOT, 'src/test/java/com/stockpile', f));
}
console.log('done');