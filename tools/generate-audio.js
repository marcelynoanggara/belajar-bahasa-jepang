#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "audio");
const MANIFEST = path.join(ROOT, "audio-map.js");
const FAIL_LOG = path.join(__dirname, "audio-failures.json");
const args = new Set(process.argv.slice(2));
const LIMIT = (() => { const a = process.argv.find(x => x.startsWith("--limit=")); return a ? Number(a.split("=")[1]) : 0; })();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const normalize = s => String(s || "").replace(/\s+/g, " ").trim();
const fileNameFor = text => crypto.createHash("sha1").update(normalize(text), "utf8").digest("hex").slice(0, 16) + ".mp3";

function loadTargets() {
  const src = fs.readFileSync(path.join(ROOT, "data.js"), "utf8") + "\n;globalThis.__data={LEVELS,KANA,KANJI};";
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const { LEVELS, KANA, KANJI } = ctx.__data;
  const texts = new Set();
  const add = raw => { const t = normalize(raw); if (t) texts.add(t); };
  for (const level of LEVELS || []) for (const mod of level.modules || []) {
    for (const ex of mod.examples || []) add(ex[0]);
    for (const v of mod.vocab || []) add(v[1]);
  }
  for (const k of KANA || []) { add(k.hiragana); add(k.katakana); }
  for (const k of KANJI || []) add(k.char);
  add("日本語を勉強しましょう。");
  return [...texts].sort((a, b) => fileNameFor(a).localeCompare(fileNameFor(b)) || a.localeCompare(b));
}

function isValidMp3(file) {
  try {
    const st = fs.statSync(file);
    if (!st.isFile() || st.size < 1200) return false;
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(512);
    const n = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    const b = buf.subarray(0, n);
    if (b.length >= 3 && b.toString("ascii", 0, 3) === "ID3") return true;
    for (let i = 0; i + 1 < Math.min(b.length - 1, 256); i++) {
      if (b[i] === 0xff && (b[i + 1] & 0xe0) === 0xe0) return true;
    }
    return false;
  } catch { return false; }
}

function fetchBuffer(url, redirects = 3) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "Referer": "https://translate.google.com/",
        "Accept": "audio/mpeg,audio/*;q=0.9,*/*;q=0.5"
      },
      timeout: 20000
    }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        res.resume();
        resolve(fetchBuffer(new URL(res.headers.location, url).toString(), redirects - 1));
        return;
      }
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks);
        if (res.statusCode !== 200) reject(new Error(`HTTP ${res.statusCode}, ${body.length} bytes`));
        else resolve(body);
      });
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

function bufferLooksMp3(buf) {
  if (!buf || buf.length < 1200) return false;
  if (buf.length >= 3 && buf.toString("ascii", 0, 3) === "ID3") return true;
  for (let i = 0; i + 1 < Math.min(buf.length - 1, 256); i++) if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) return true;
  return false;
}

async function downloadOne(text) {
  const clean = normalize(text).slice(0, 220);
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(clean)}`;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const buf = await fetchBuffer(url);
      if (!bufferLooksMp3(buf)) throw new Error(`not MPEG (${buf.length} bytes)`);
      return buf;
    } catch (e) {
      lastError = e;
      if (attempt < 3) await sleep(500 * attempt);
    }
  }
  throw lastError;
}

function writeManifest(map) {
  const ordered = {};
  for (const key of Object.keys(map).sort((a, b) => a.localeCompare(b))) ordered[key] = map[key];
  const body = `"use strict";\n/* Dipakai app.js: teks ternormalisasi -> audio same-origin. Diperbarui tools/generate-audio.js */\nconst AUDIO_MAP = ${JSON.stringify(ordered, null, 2)};\n`;
  fs.writeFileSync(MANIFEST, body, "utf8");
  return Object.keys(ordered).length;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(FAIL_LOG), { recursive: true });
  let targets = loadTargets();
  const totalUnique = targets.length;
  if (LIMIT > 0) targets = targets.slice(0, LIMIT);
  const map = {};
  const failures = [];
  let downloaded = 0, skipped = 0;
  for (let i = 0; i < targets.length; i++) {
    const text = targets[i];
    const name = fileNameFor(text);
    const dest = path.join(OUT_DIR, name);
    if (isValidMp3(dest)) { map[text] = `assets/audio/${name}`; skipped++; continue; }
    try {
      const buf = await downloadOne(text);
      fs.writeFileSync(dest, buf);
      if (!isValidMp3(dest)) throw new Error("saved file failed MPEG validation");
      map[text] = `assets/audio/${name}`;
      downloaded++;
    } catch (e) {
      failures.push({ text, file: name, error: String(e && e.message || e) });
      try { if (fs.existsSync(dest) && !isValidMp3(dest)) fs.unlinkSync(dest); } catch {}
    }
    if ((i + 1) % 50 === 0 || i === targets.length - 1) console.log(`${i + 1}/${targets.length} processed; ok=${Object.keys(map).length} downloaded=${downloaded} skipped=${skipped} failed=${failures.length}`);
    if (i < targets.length - 1) await sleep(120);
  }
  const entries = writeManifest(map);
  fs.writeFileSync(FAIL_LOG, JSON.stringify(failures, null, 2), "utf8");
  console.log(JSON.stringify({ totalUnique, attempted: targets.length, manifestEntries: entries, downloaded, skippedValid: skipped, failures: failures.length, failLog: path.relative(ROOT, FAIL_LOG) }, null, 2));
  if (failures.length) console.log("FAILED TEXTS:\n" + failures.map(f => `- ${f.text} (${f.error})`).join("\n"));
}

main().catch(e => { console.error(e); process.exit(1); });
