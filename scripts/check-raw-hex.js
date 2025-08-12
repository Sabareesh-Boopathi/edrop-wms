#!/usr/bin/env node
/* Simple CI guard: fail if raw hex colors appear outside tokens.css */
const { readFileSync, readdirSync, statSync } = require('fs');
const { join } = require('path');

const root = process.argv[2] || join(__dirname, '..', 'frontend', 'src');
const tokenFile = 'tokens.css';
let failed = false;

function walk(dir){
  for(const entry of readdirSync(dir)){
    const p = join(dir, entry);
    const st = statSync(p);
    if(st.isDirectory()) walk(p); else if(/\.(css|tsx|ts|jsx|js)$/.test(entry)) {
      if(entry === tokenFile) continue;
      const content = readFileSync(p,'utf8');
      // match #abc or #aabbcc (skip linear-gradient(# positions with var or rgba maybe) we just general)
      const matches = content.match(/#[0-9a-fA-F]{3,6}\b/g);
      if(matches){
        console.error(`Raw hex in ${p}: ${[...new Set(matches)].join(', ')}`);
        failed = true;
      }
    }
  }
}
walk(root);
if(failed){
  console.error('\nHex color usage found outside tokens.css. Use CSS variables.');
  process.exit(1);
} else {
  console.log('No raw hex colors outside tokens.css.');
}
