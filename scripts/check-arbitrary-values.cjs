#!/usr/bin/env node
// Check Tailwind arbitrary value classes that can be replaced with built-in utilities
const fs = require('fs');
const path = require('path');

const SPACING_CLASSES = new Set(['w','h','min-w','max-w','min-h','max-h','p','px','py','pt','pr','pb','pl','m','mx','my','mt','mr','mb','ml','gap','gap-x','gap-y','inset','inset-x','inset-y','top','right','bottom','left','space-x','space-y','scroll-m','scroll-p','size','basis','translate','translate-x','translate-y','translate-z']);
const FONT_SIZES = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60, '7xl': 72, '8xl': 96, '9xl': 128 };

const pattern = /([\w-]+)-\[(\d+)px\]/g;
const results = [];
const scannedFiles = new Set();

function scan(file) {
  if (scannedFiles.has(file)) return;
  scannedFiles.add(file);
  
  const lines = fs.readFileSync(file, 'utf-8').split('\n');
  const rel = path.relative(process.cwd(), file);
  for (let i = 0; i < lines.length; i++) {
    let m; pattern.lastIndex = 0;
    while ((m = pattern.exec(lines[i])) !== null) {
      const cls = m[1], px = parseInt(m[2]);
      if (SPACING_CLASSES.has(cls)) {
        const u = px / 4;
        results.push({ file: rel, line: i + 1, col: m.index + 1, current: m[0], suggested: `${cls}-${u}`, type: 'spacing' });
      } else if (cls === 'text') {
        const match = Object.entries(FONT_SIZES).find(([, v]) => v === px);
        results.push({ file: rel, line: i + 1, col: m.index + 1, current: m[0], suggested: match ? `text-${match[0]}` : null, type: 'text' });
      } else if (cls === 'leading') {
        const u = px / 4;
        results.push({ file: rel, line: i + 1, col: m.index + 1, current: m[0], suggested: `leading-${u}`, type: 'spacing' });
      } else if (cls === 'rounded') {
        const u = px / 4;
        results.push({ file: rel, line: i + 1, col: m.index + 1, current: m[0], suggested: `rounded-${u}`, type: 'spacing' });
      }
    }
  }
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.vue') || e.name.endsWith('.ts')) scan(p);
  }
}

// Handle individual files (from lint-staged) or directories
const targets = process.argv.slice(2);
if (targets.length === 0) {
  walk(path.resolve('.'));
} else {
  for (const target of targets) {
    const resolved = path.resolve(target);
    if (fs.statSync(resolved).isDirectory()) {
      walk(resolved);
    } else if (target.endsWith('.vue') || target.endsWith('.ts')) {
      scan(resolved);
    }
  }
}

const spacing = results.filter(r => r.type === 'spacing');
const textOk = results.filter(r => r.type === 'text' && r.suggested);
const textNok = results.filter(r => r.type === 'text' && !r.suggested);

if (spacing.length) {
  console.log(`\n✅ ${spacing.length} classe(s) de espaçamento — TODAS podem ser convertidas (Tailwind v4 JIT aceita qualquer valor numérico):\n`);
  for (const r of spacing) console.log(`   ${r.file}:${r.line}:${r.col}  ${r.current} → ${r.suggested}`);
}

if (textOk.length) {
  console.log(`\n✅ ${textOk.length} classe(s) de texto com conversão exata:\n`);
  for (const r of textOk) console.log(`   ${r.file}:${r.line}:${r.col}  ${r.current} → ${r.suggested}`);
}

if (textNok.length) {
  console.log(`\n❌ ${textNok.length} classe(s) de texto SEM equivalente na escala font-size:\n`);
  for (const r of textNok) console.log(`   ${r.file}:${r.line}:${r.col}  ${r.current}  (sem equivalente — tamanho não padrão)`);
}

console.log(`\nTotal: ${results.length} ocorrências em ${scannedFiles.size} arquivos\n`);

// Exit with error if issues found (for pre-commit hook)
if (results.length > 0) {
  process.exit(1);
}
