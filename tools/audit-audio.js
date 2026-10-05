#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const normalize = s => String(s || "").replace(/\s+/g, " ").trim();

function validMp3(file) {
  try {
    const st = fs.statSync(file);
    if (!st.isFile() || st.size < 1200) return false;
    const b = fs.readFileSync(file).subarray(0, 512);
    if (b.length >= 3 && b.toString("ascii", 0, 3) === "ID3") return true;
    for (let i = 0; i + 1 < Math.min(b.length - 1, 256); i++) if (b[i] === 0xff && (b[i + 1] & 0xe0) === 0xe0) return true;
    return false;
  } catch { return false; }
}
function load(file, expr) {
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), ctx);
  return vm.runInContext(expr, ctx);
}
const dataSrc = fs.readFileSync(path.join(ROOT, "data.js"), "utf8") + "\n;globalThis.__data={LEVELS,KANA,KANJI};";
const dctx = { console }; vm.createContext(dctx); vm.runInContext(dataSrc, dctx);
const { LEVELS, KANA, KANJI } = dctx.__data;
const targets = new Set();
const add = x => { const t = normalize(x); if (t) targets.add(t); };
for (const l of LEVELS) for (const m of l.modules) { for (const e of m.examples || []) add(e[0]); for (const v of m.vocab || []) add(v[1]); }
for (const k of KANA) { add(k.hiragana); add(k.katakana); }
for (const k of KANJI) add(k.char);
add("日本語を勉強しましょう。");
const map = load("audio-map.js", "AUDIO_MAP");
let covered = 0;
const missing = [];
for (const text of targets) {
  const rel = map[text];
  if (rel && validMp3(path.join(ROOT, rel))) covered++;
  else missing.push({ text, mapped: rel || null, valid: rel ? validMp3(path.join(ROOT, rel)) : false });
}
const audioDir = path.join(ROOT, "assets", "audio");
const files = fs.existsSync(audioDir) ? fs.readdirSync(audioDir).filter(f => f.endsWith(".mp3")) : [];
let totalBytes = 0, invalid = 0;
for (const f of files) { const p = path.join(audioDir, f); totalBytes += fs.statSync(p).size; if (!validMp3(p)) invalid++; }
const report = {
  uniqueTargets: targets.size,
  manifestEntries: Object.keys(map).length,
  coveredValid: covered,
  coveragePercent: Number((covered / targets.size * 100).toFixed(2)),
  missingOrInvalid: missing.length,
  missingSample: missing.slice(0, 20),
  filesOnDisk: files.length,
  invalidFilesOnDisk: invalid,
  totalBytes,
  totalMiB: Number((totalBytes / 1048576).toFixed(2))
};
console.log(JSON.stringify(report, null, 2));
if (report.coveragePercent < 95) process.exitCode = 2;
