const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // 1. Strip ALL dark mode classes
  content = content.replace(/dark:[\w-./[]]+\s?/g, '');
  // Clean up double spaces left behind
  content = content.replace(/\s{2,}/g, ' ').replace(/ "\}/g, '"}').replace(/ ">/g, '">');

  // 2. Replace generic Slate / Indigo / Emerald / Amber / Red colors
  
  // Backgrounds
  content = content.replace(/bg-slate-50\/55|bg-slate-50\/50/g, 'bg-surface-2');
  content = content.replace(/bg-slate-50/g, 'bg-surface-2');
  content = content.replace(/bg-slate-100\/50|bg-slate-100/g, 'bg-surface-2');
  content = content.replace(/bg-white\/60|bg-white/g, 'bg-surface');
  
  content = content.replace(/bg-indigo-600/g, 'bg-accent');
  content = content.replace(/bg-indigo-700/g, 'bg-accent-2');
  content = content.replace(/bg-indigo-50/g, 'bg-accent-bg');
  
  content = content.replace(/bg-emerald-600/g, 'bg-success');
  content = content.replace(/bg-emerald-700/g, 'bg-success');
  content = content.replace(/bg-emerald-50|bg-emerald-500\/10/g, 'bg-success-bg');
  
  content = content.replace(/bg-amber-500|bg-amber-600/g, 'bg-warning');
  content = content.replace(/bg-amber-50|bg-amber-500\/10/g, 'bg-warning-bg');
  
  content = content.replace(/bg-red-600|bg-red-700/g, 'bg-danger');
  content = content.replace(/bg-red-50|bg-red-500\/10/g, 'bg-danger-bg');

  // Text colors
  content = content.replace(/text-slate-800|text-slate-900|text-slate-850/g, 'text-ink-1');
  content = content.replace(/text-slate-700|text-slate-600|text-slate-550/g, 'text-ink-2');
  content = content.replace(/text-slate-500|text-slate-400|text-slate-450/g, 'text-ink-3');
  content = content.replace(/text-slate-300|text-slate-350|text-slate-200/g, 'text-ink-4');
  
  content = content.replace(/text-indigo-500|text-indigo-600|text-indigo-650/g, 'text-accent');
  content = content.replace(/text-emerald-500|text-emerald-600|text-emerald-700/g, 'text-success');
  content = content.replace(/text-amber-500|text-amber-600|text-amber-700|text-amber-800/g, 'text-warning');
  content = content.replace(/text-red-500|text-red-600|text-red-700/g, 'text-danger');
  content = content.replace(/text-white/g, 'text-surface');

  // Borders
  content = content.replace(/border-slate-200\/60|border-slate-200\/50|border-slate-200|border-slate-150|border-slate-100/g, 'border-border');
  content = content.replace(/border-indigo-150|border-indigo-200\/50/g, 'border-accent');
  content = content.replace(/border-emerald-200\/50|border-emerald-200\/30/g, 'border-success-bd');
  content = content.replace(/border-amber-200\/50|border-amber-250/g, 'border-warning-bd');
  content = content.replace(/border-red-200\/50|border-red-200\/30|border-red-200|border-red-100/g, 'border-danger-bd');

  // Hovers
  content = content.replace(/hover:bg-slate-50\/40|hover:bg-slate-50|hover:bg-slate-100/g, 'hover:bg-surface-2');
  content = content.replace(/hover:bg-indigo-700/g, 'hover:bg-accent-2');
  content = content.replace(/hover:bg-emerald-700/g, 'hover:bg-success');
  content = content.replace(/hover:bg-amber-600/g, 'hover:bg-warning');
  content = content.replace(/hover:bg-red-500\/10/g, 'hover:bg-danger-bg');
  content = content.replace(/hover:text-slate-800/g, 'hover:text-ink-1');

  // Fix up specific badges in getStatusBadge
  content = content.replace(/bg-success-bg text-success text-xs font-bold border-success-bd/g, 'bg-success-bg text-success text-xs font-bold border border-success-bd');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

walkDir(srcDir);
console.log('Done mapping colors and stripping dark mode classes.');
