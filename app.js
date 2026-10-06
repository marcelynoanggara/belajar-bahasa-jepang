"use strict";

const STORAGE_KEY = "nihonGoMasterProgressV1";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const levelById = id => LEVELS.find(level => level.id === id);
const allModules = () => LEVELS.flatMap(level => level.modules.map(module => ({ ...module, levelId: level.id, levelCode: level.code })));
const allVocab = () => allModules().flatMap(module => module.vocab.map(v => ({ jp: v[0], reading: v[1], romaji: v[2], meaning: v[3], level: module.levelCode, source: module.title })));

function defaultProgress() {
  return { completedLessons: [], knownKana: [], xp: 0, streak: 0, lastStudyDate: null, bestScores: {}, quizSessions: 0 };
}
function loadProgress() {
  try { return { ...defaultProgress(), ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; }
  catch { return defaultProgress(); }
}
let progress = loadProgress();
function saveProgress() { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
function todayKey(date = new Date()) { return date.toISOString().slice(0, 10); }
function recordStudy(xp = 0) {
  const today = todayKey();
  if (progress.lastStudyDate !== today) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    progress.streak = progress.lastStudyDate === todayKey(yesterday) ? (progress.streak || 0) + 1 : 1;
    progress.lastStudyDate = today;
  }
  progress.xp = (progress.xp || 0) + xp;
  saveProgress(); renderDashboard();
}
/* ===== Audio: MP3 TTS utama, Web Speech sebagai cadangan ===== */
let cachedJapaneseVoices = [];
function refreshCachedVoices() {
  if (!("speechSynthesis" in window)) { cachedJapaneseVoices = []; return cachedJapaneseVoices; }
  const voices = window.speechSynthesis.getVoices() || [];
  cachedJapaneseVoices = voices.filter(v => v && v.lang && v.lang.toLowerCase().replace("_", "-").startsWith("ja"));
  return cachedJapaneseVoices;
}
if ("speechSynthesis" in window) {
  refreshCachedVoices();
  if (typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", refreshCachedVoices);
  } else if ("onvoiceschanged" in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = refreshCachedVoices;
  }
}
let activeFallbackAudio = null;
let activeSpeechToken = 0;
let audioNoticeShown = false;
function buildFallbackTtsUrl(text, maxLength = 140) {
  const cleanText = String(text || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
}
function normalizeSpeechText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}
function localAudioPathFor(cleanText) {
  if (typeof AUDIO_MAP === "undefined" || !AUDIO_MAP || typeof AUDIO_MAP !== "object") return null;
  const path = AUDIO_MAP[cleanText];
  return typeof path === "string" && /^assets\/audio\/[a-f0-9]{16}\.mp3$/.test(path) ? path : null;
}
function playAudioSource(src, button, token, onError, errorLabel) {
  const audio = new Audio(src);
  activeFallbackAudio = audio;
  let done = false;
  const finish = errorMessage => {
    if (done) return; done = true;
    if (activeFallbackAudio === audio) activeFallbackAudio = null;
    if (errorMessage && token === activeSpeechToken) {
      if (onError) { setSpeakButtonPlaying(button, false); onError(errorMessage); }
      else {
        setSpeakButtonPlaying(button, false);
        notifyAudioProblem(errorMessage);
      }
      return;
    }
    setSpeakButtonPlaying(button, false);
  };
  audio.addEventListener("ended", () => finish(), { once: true });
  audio.addEventListener("error", () => finish(`${errorLabel} gagal dimuat.`), { once: true });
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => finish(`${errorLabel} gagal diputar.`));
  }
  return audio;
}
function playLocalAudio(cleanText, button, token, onError) {
  const src = localAudioPathFor(cleanText);
  if (!src) return false;
  playAudioSource(src, button, token, onError, "Audio lokal");
  return true;
}
function playFallbackAudio(cleanText, button, token, onError = null) {
  return playAudioSource(buildFallbackTtsUrl(cleanText), button, token, onError, "Audio utama");
}
function setSpeakButtonPlaying(button, isPlaying) {
  if (!button) return;
  if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent || "🔊";
  const original = button.dataset.originalLabel;
  button.classList.toggle("playing", isPlaying);
  button.setAttribute("aria-busy", isPlaying ? "true" : "false");
  if (isPlaying && /^🔊/.test(original)) button.textContent = "🔊 …";
  if (!isPlaying) button.textContent = original;
}
function notifyAudioProblem(message = "Audio belum bisa diputar. Coba sekali lagi.") {
  console.warn(message);
  if (!audioNoticeShown) {
    audioNoticeShown = true;
    setTimeout(() => { audioNoticeShown = false; }, 8000);
    if (typeof alert === "function") alert(`${message}\n\nJika masih gagal, periksa koneksi internet atau aktifkan suara/browser lain.`);
  }
}
function stopAllAudio() {
  activeSpeechToken += 1;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (activeFallbackAudio) {
    try { activeFallbackAudio.pause(); activeFallbackAudio.currentTime = 0; } catch { /* abaikan */ }
    activeFallbackAudio = null;
  }
  $$(".speak-btn.playing, .text-button.playing, .button.playing").forEach(button => setSpeakButtonPlaying(button, false));
}
function speak(text, button = null) {
  const cleanText = normalizeSpeechText(text);
  if (!cleanText) return;
  stopAllAudio();
  const token = activeSpeechToken;
  const spokenText = cleanText.slice(0, 220);
  setSpeakButtonPlaying(button, true);

  const tryRemoteThenWebSpeech = () => {
    if (token !== activeSpeechToken) return;
    setSpeakButtonPlaying(button, true);
    playFallbackAudio(spokenText, button, token, () => {
      if (token !== activeSpeechToken) return;
      console.warn("Audio remote gagal; mencoba Web Speech sebagai cadangan terakhir.");
      speakWithWebSpeech(spokenText, button, token);
    });
  };

  // 1) Audio same-origin dari AUDIO_MAP adalah jalur utama agar tidak bergantung domain Google.
  if (playLocalAudio(spokenText, button, token, () => {
    console.warn("Audio lokal gagal; mencoba audio remote sebagai cadangan.");
    tryRemoteThenWebSpeech();
  })) return;

  // 2) Teks yang belum terpetakan memakai remote, lalu 3) Web Speech.
  tryRemoteThenWebSpeech();
}
function speakWithWebSpeech(cleanText, button, token) {
  setSpeakButtonPlaying(button, true);
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    setSpeakButtonPlaying(button, false);
    if (token === activeSpeechToken) notifyAudioProblem("Audio belum bisa diputar di browser ini.");
    return;
  }

  const voices = refreshCachedVoices();
  let utterance;
  try {
    utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 220));
  } catch {
    setSpeakButtonPlaying(button, false);
    if (token === activeSpeechToken) notifyAudioProblem("Audio belum bisa diputar di browser ini.");
    return;
  }
  utterance.lang = "ja-JP"; utterance.rate = 0.88;
  const japaneseVoice = voices.find(v => v) || cachedJapaneseVoices[0];
  if (japaneseVoice) utterance.voice = japaneseVoice;

  utterance.onend = () => { if (token === activeSpeechToken) setSpeakButtonPlaying(button, false); };
  utterance.onerror = event => {
    if (token !== activeSpeechToken) return;
    setSpeakButtonPlaying(button, false);
    const errorName = event && event.error ? String(event.error) : "";
    if (errorName !== "interrupted" && errorName !== "canceled") {
      notifyAudioProblem("Audio belum bisa diputar. Periksa suara perangkat lalu coba lagi.");
    }
  };

  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    if (token === activeSpeechToken) {
      setSpeakButtonPlaying(button, false);
      notifyAudioProblem("Audio belum bisa diputar di browser ini.");
    }
  }
}
function speakButton(text, label = "🔊") {
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "speak-btn"; btn.textContent = label;
  btn.dataset.originalLabel = label;
  btn.setAttribute("aria-label", `Dengarkan: ${text}`); btn.addEventListener("click", () => speak(text, btn)); return btn;
}

/* Komponen presentasi yang dipakai ulang: Jepang di atas, romaji/bacaan tepat di bawahnya, lalu arti Indonesia. */
function jpStackHTML({ jp, romaji = "", readings = [], meaning = "", meta = "", stackClass = "" } = {}) {
  const readingLines = (Array.isArray(readings) ? readings : [readings]).filter(Boolean)
    .map(reading => `<span class="jp-stack-reading">${reading}</span>`).join("");
  return `<span class="jp-stack ${stackClass}">
    ${jp ? `<span class="jp-stack-jp jp">${jp}</span>` : ""}
    ${romaji ? `<span class="jp-stack-romaji">${romaji}</span>` : ""}${readingLines}
    ${meaning ? `<span class="jp-stack-meaning">${meaning}</span>` : ""}
    ${meta ? `<span class="jp-stack-meta">${meta}</span>` : ""}
  </span>`;
}
function exampleStackHTML(example, stackClass = "") {
  const match = String(example || "").match(/^(.*?)[（(]([^（）()]+)[）)]\s*[—–-]\s*(.+)$/);
  if (!match) return `<p class="meaning ${stackClass}">${example || ""}</p>`;
  // Contoh satu kata majemuk (Kanji（bacaan）): tumpukan tunggal sudah tepat.
  return jpStackHTML({ jp: match[1].trim(), romaji: match[2].trim(), meaning: match[3].trim(), stackClass: `jp-stack-example ${stackClass}` });
}
function alignedExampleTextHTML(example, stackClass = "") {
  // Contoh dengan romaji kalimat (mis. data kosakata): romaji disejajarkan per kata.
  const match = String(example || "").match(/^(.*?)[（(]([^（）()]+)[）)]\s*[—–-]\s*(.+)$/);
  if (match) return alignedRomajiHTML(match[1].trim(), match[2].trim(), match[3].trim(), `jp-stack-example ${stackClass}`);
  const dash = String(example || "").match(/^(.+?)\s*[—–-]\s*(.+)$/);
  if (!dash) return `<p class="meaning ${stackClass}">${example || ""}</p>`;
  return jpStackHTML({ jp: dash[1].trim(), meaning: dash[2].trim(), stackClass: `jp-stack-example ${stackClass}` });
}
function translatedExampleHTML(example, stackClass = "") {
  const match = String(example || "").match(/^(.+?)\s*[—–-]\s*(.+)$/);
  if (!match) return `<p class="meaning ${stackClass}">${example || ""}</p>`;
  return jpStackHTML({ jp: match[1].trim(), meaning: match[2].trim(), stackClass: `jp-stack-example ${stackClass}` });
}
/* Romaji per kata (gaya ruby/furigana): kata Jepang di atas, romaji tepat di bawah kata itu.
   Penyelarasan token per spasi + partikel/akhiran; bila jumlah tidak cocok -> fallback kalimat utuh. */
const ALIGN_PARTICLES = ["から","まで","は","が","を","に","へ","で","と","も","の","か"];
const ALIGN_ENDINGS = ["ませんか","なりません","ません","ました","でしょう","ください","したい","です","ます","たい"];
function alignParticleAt(s, j){
  if (j <= 0) return null;
  const prev = s[j-1];
  for (const p of ALIGN_PARTICLES){
    if (!s.startsWith(p, j)) continue;
    if ((p === "の" || p === "か") && (prev === "ん" || (p === "の" && prev === "こ"))) return null;
    if ((p === "に" || p === "は") && prev === "ん") return null;
    if (p === "で"){
      const rest = s.slice(j);
      const hasEnding = ALIGN_ENDINGS.some(e => rest.startsWith("で" + e));
      const next = s[j+1];
      if (!hasEnding && next && !/[。．.!！?？、,]/.test(next)) return null;
    }
    return p;
  }
  return null;
}
function alignSplitSegment(seg){
  // pass 1: kata + partikel sebagai token tersendiri
  const chunks = []; let start = 0;
  for (let j = 0; j < seg.length; j++){
    const p = alignParticleAt(seg, j);
    if (p){ if (j > start) chunks.push(seg.slice(start, j)); chunks.push(p); j += p.length - 1; start = j + 1; }
  }
  if (start < seg.length) chunks.push(seg.slice(start));
  // pass 2: pisahkan akhiran sopan (です/ます/dll) dari potongan terakhir bila perlu
  const units = [];
  chunks.forEach(chunk => {
    if (ALIGN_PARTICLES.includes(chunk)) { units.push(chunk); return; }
    let rest = chunk; const ends = [];
    while (true){
      const e = ALIGN_ENDINGS.find(e => rest.length > e.length && rest.endsWith(e));
      if (!e) break; ends.unshift(e); rest = rest.slice(0, -e.length);
    }
    if (rest) units.push(rest); units.push(...ends);
  });
  return units;
}
function alignJapaneseUnits(jpText){
  const units = [];
  String(jpText || "").trim().split(/\s+/).filter(Boolean).forEach(tok => {
    tok.split(/(?<=[。．.!！?？])/).filter(Boolean).forEach(seg => {
      let punct = ""; const pm = seg.match(/([。．.!！?？、,]+)$/);
      if (pm){ punct = pm[1]; seg = seg.slice(0, seg.length - punct.length); }
      units.push(...alignSplitSegment(seg));
      if (punct && units.length) units[units.length - 1] += punct;
    });
  });
  return units;
}
function alignRomajiTokens(romajiText){
  return String(romajiText || "").trim().split(/\s+/).filter(Boolean).map(t => t.replace(/[,;:]+$/, ""));
}
/**
 * Pasangkan romaji per kata dengan kata Jepang.
 * Kembalikan { aligned:true, pairs:[[jp,romaji]..] } atau { aligned:false } (fallback utuh).
 */
function alignRomajiPairs(jpText, romajiText){
  const jp = String(jpText || "").replace(/\s+/g, " ").trim();
  const ro = String(romajiText || "").replace(/\s+/g, " ").trim();
  if (!jp || !ro) return { aligned: false };
  if (!/\s/.test(jp) && !/[はがをにへでとものかからまで]/.test(jp)) {
    return { aligned: true, pairs: [[jp, ro]] }; // satu kata/frasa tunggal
  }
  let units = alignJapaneseUnits(jp);
  const romaji = alignRomajiTokens(ro);
  if (!units.length || !romaji.length) return { aligned: false };
  // Samakan jumlah secara terbatas: hanya izinkan SELISIH kecil (<=2) agar kalimat
  // berantakan tidak dipaksakan berpasangan. Penggabungan ekor meniru kelompok akhir
  // yang memang menyatu dalam romaji data (mis. "...masu." / "... desu.").
  const diff = Math.abs(units.length - romaji.length);
  if (diff > 2) return { aligned: false };
  while (units.length > romaji.length && units.length > 1){
    const last = units.pop(); const prev = units.pop(); units.push(prev + last);
  }
  const mergedRo = [...romaji];
  while (mergedRo.length > units.length && mergedRo.length > 1){
    const last = mergedRo.pop(); const prev = mergedRo.pop();
    mergedRo.push(prev + " " + last);
  }
  if (units.length !== mergedRo.length) return { aligned: false };
  if (!units.length) return { aligned: false };
  // Kalimat multi-kata yang menyusut jadi 1 pasangan berarti penyelarasan gagal: fallback.
  if (units.length === 1 && /\s/.test(jp)) return { aligned: false };
  // Tiap pasangan wajib berisi Jepang dan romaji yang tidak kosong.
  const pairs = units.map((u, i) => [u, mergedRo[i]]);
  if (pairs.some(([u, r]) => !u.trim() || !String(r || "").trim())) return { aligned: false };
  return { aligned: true, pairs };
}
function alignedRomajiHTML(jpText, romajiText, meaning = "", stackClass = ""){
  const result = alignRomajiPairs(jpText, romajiText);
  if (!result.aligned){
    // fallback gaya lama: kalimat utuh + romaji utuh, tidak dipasangkan per kata
    return `<span class="jp-stack ${stackClass}">
      <span class="jp-stack-jp jp">${jpText || ""}</span>
      ${romajiText ? `<span class="jp-stack-romaji">${romajiText}</span>` : ""}
      ${meaning ? `<span class="jp-stack-meaning">${meaning}</span>` : ""}
    </span>`;
  }
  const words = result.pairs.map(([jp, ro]) =>
    `<span class="rw-word"><span class="rw-jp jp">${jp}</span><span class="rw-ro">${ro}</span></span>`).join("");
  return `<span class="jp-stack ${stackClass}"><span class="rw-line">${words}</span>${meaning ? `<span class="jp-stack-meaning">${meaning}</span>` : ""}</span>`;
}

function shuffle(array) { return [...array].sort(() => Math.random() - 0.5); }
function sample(array, count) { return shuffle(array).slice(0, count); }
function completionForLevel(level) {
  if (!level.modules.length) return 0;
  const done = level.modules.filter(m => progress.completedLessons.includes(m.id)).length;
  return Math.round(done / level.modules.length * 100);
}
function isLevelUnlocked(index) {
  if (index <= 1) return true;
  return completionForLevel(LEVELS[index - 1]) >= 60;
}
function overallPercent() {
  const modules = allModules();
  const lessonPart = modules.filter(m => progress.completedLessons.includes(m.id)).length / modules.length;
  const kanaPart = progress.knownKana.length / KANA.length;
  return Math.round((lessonPart * 0.75 + kanaPart * 0.25) * 100);
}
function nextRecommended() {
  const modules = allModules();
  return modules.find(m => !progress.completedLessons.includes(m.id)) || modules[modules.length - 1];
}

/* ===== Dashboard & Roadmap ===== */
function renderDashboard() {
  const percent = overallPercent();
  $("#overallPercent").textContent = `${percent}%`;
  $("#overallBar").style.width = `${percent}%`;
  $("#overallBarWrap").setAttribute("aria-valuenow", String(percent));
  $("#xpStat").textContent = progress.xp || 0;
  $("#streakStat").textContent = progress.streak || 0;
  $("#lessonStat").textContent = progress.completedLessons.length;
  $("#kanaStat").textContent = progress.knownKana.length;
  const next = nextRecommended();
  $("#nextLessonTitle").textContent = next.title;
  $("#nextLessonMeta").textContent = `${next.levelCode} • ${next.type} • ±${next.minutes} menit • +${next.xp} XP`;
  $("#goNextLesson").onclick = () => selectLesson(next.id, true);
}
function renderLevels() {
  const grid = $("#levelGrid"); grid.innerHTML = "";
  const current = nextRecommended();
  LEVELS.forEach((level, index) => {
    const percent = completionForLevel(level);
    const unlocked = isLevelUnlocked(index);
    const isCurrent = current.levelId === level.id && percent < 100;
    const card = document.createElement("article");
    card.className = `level-card ${unlocked ? "" : "locked"} ${isCurrent ? "current" : ""}`; card.style.setProperty("--level-color", level.color);
    card.innerHTML = `
      <div class="level-topline"><span class="step-pill">Langkah ${index + 1}</span>${isCurrent ? `<span class="current-pill">👉 Kamu di sini</span>` : ""}</div>
      <div class="level-icon" aria-hidden="true">${level.icon}</div>
      <div class="level-meta"><span>${level.code}</span><span>${percent}% selesai</span></div>
      <h3>${level.name}</h3><p>${level.description}</p>
      <div class="mini-bar" aria-hidden="true"><span style="width:${percent}%"></span></div>
      <p class="level-status"><span class="badge ${percent === 100 ? "done" : unlocked ? "" : "lock"}">${percent === 100 ? "Selesai" : unlocked ? "Siap dipelajari" : "Terbuka setelah tingkat sebelumnya cukup selesai"}</span></p>
      <button class="button ghost small" type="button">Lihat ${level.modules.length} pelajaran di tingkat ini</button>`;
    card.querySelector("button").addEventListener("click", () => {
      $("#lessonLevelFilter").value = level.id; renderLessonList(); document.querySelector("#lessons").scrollIntoView({ behavior: "smooth" });
    });
    grid.appendChild(card);
  });
}

/* ===== Lessons ===== */
let selectedLessonId = null;
function initLessonFilter() {
  const select = $("#lessonLevelFilter");
  select.innerHTML = `<option value="all">Semua level</option>` + LEVELS.map(l => `<option value="${l.id}">${l.code} — ${l.name}</option>`).join("");
  select.addEventListener("change", renderLessonList);
}
function renderLessonList() {
  const filter = $("#lessonLevelFilter").value;
  const list = $("#lessonList"); list.innerHTML = "";
  allModules().filter(m => filter === "all" || m.levelId === filter).forEach(module => {
    const done = progress.completedLessons.includes(module.id);
    const btn = document.createElement("button"); btn.type = "button";
    btn.className = `lesson-item ${module.id === selectedLessonId ? "active" : ""}`;
    btn.innerHTML = `<strong>${module.title}</strong><span>${module.levelCode} • ${module.type} • ±${module.minutes} menit</span>${done ? `<span class="done-label">✓ Selesai</span>` : ""}`;
    btn.addEventListener("click", () => selectLesson(module.id, false));
    list.appendChild(btn);
  });
  if (!selectedLessonId) selectLesson(nextRecommended().id, false);
}
function selectLesson(moduleId, scroll) {
  const module = allModules().find(m => m.id === moduleId); if (!module) return;
  selectedLessonId = moduleId; renderLessonList();
  const panel = $("#lessonPanel");
  panel.innerHTML = `
    <p class="eyebrow">${module.levelCode} • ${module.type}</p>
    <h3>${module.title}</h3><p class="intro">${module.intro}</p>
    <div class="pattern-box">${module.pattern}</div>
    <h4>Fokus materi</h4><ul class="focus-list">${module.focus.map(f => `<li>${f}</li>`).join("")}</ul>
    <h4>Contoh kalimat</h4><div class="example-list"></div>
    <h4>Kosakata modul</h4><div class="vocab-list"></div>
    <button class="button primary wide" id="completeLesson" type="button">${progress.completedLessons.includes(module.id) ? "✓ Sudah selesai — tandai ulang" : `Tandai selesai (+${module.xp} XP)`}</button>`;
  const examples = $(".example-list", panel);
  module.examples.forEach(([jp, romaji, meaning]) => {
    const card = document.createElement("div"); card.className = "example-card";
    card.innerHTML = alignedRomajiHTML(jp, romaji, meaning, "jp-stack-lesson");
    card.appendChild(speakButton(jp));
    examples.appendChild(card);
  });
  const vocab = $(".vocab-list", panel);
  module.vocab.forEach(([jp, reading, romaji, meaning]) => {
    const card = document.createElement("div"); card.className = "vocab-card";
    card.innerHTML = jpStackHTML({ jp, romaji, meaning, meta: `Bacaan: ${reading}`, stackClass: "jp-stack-vocab" });
    card.appendChild(speakButton(reading));
    vocab.appendChild(card);
  });
  $("#completeLesson").addEventListener("click", () => {
    if (!progress.completedLessons.includes(module.id)) {
      progress.completedLessons.push(module.id); recordStudy(module.xp);
    } else recordStudy(0);
    renderLevels(); renderLessonList(); selectLesson(module.id, false);
  });
  if (scroll) panel.scrollIntoView({ behavior: "smooth", block: "start" });
}
function renderLessonListSelection() {
  $$(".lesson-item").forEach(item => item.classList.remove("active"));
  // renderLessonList rebuilds nodes, so selection is applied there through selectedLessonId.
}

/* ===== Kana Trainer ===== */
let kanaScript = "hiragana";
let kanaIndex = 0;
let cardFlipped = false;
function currentKana() { return KANA[kanaIndex]; }
function renderKanaCard() {
  const item = currentKana();
  const kana = kanaScript === "hiragana" ? item.hiragana : item.katakana;
  $("#flashcard").classList.toggle("flipped", cardFlipped);
  $("#cardKana").textContent = kana;
  $("#cardScript").textContent = `${kanaScript === "hiragana" ? "Hiragana" : "Katakana"} • ${item.group}`;
  $("#cardRomaji").textContent = item.romaji;
  $("#cardBackKana").textContent = kana;
  $("#cardExample").innerHTML = alignedRomajiHTML(item.example[0], item.example[1], item.example[2], "jp-stack-example");
  const key = `${kanaScript}:${item.romaji}:${kana}`;
  $("#markKana").textContent = progress.knownKana.includes(key) ? "✓ Sudah dikuasai" : "✓ Tandai sudah dikuasai";
  $("#kanaCounter").textContent = `${kanaIndex + 1} / ${KANA.length} • dikuasai: ${progress.knownKana.length}`;
}
function renderKanaChart(filter = "") {
  const chart = $("#kanaChart"); chart.innerHTML = "";
  KANA.filter(item => {
    const value = `${item.hiragana} ${item.katakana} ${item.romaji} ${item.group}`.toLowerCase();
    return value.includes(filter.toLowerCase());
  }).forEach(item => {
    const kana = kanaScript === "hiragana" ? item.hiragana : item.katakana;
    const key = `${kanaScript}:${item.romaji}:${kana}`;
    const cell = document.createElement("button"); cell.type = "button";
    cell.className = `kana-cell ${progress.knownKana.includes(key) ? "mastered" : ""}`;
    cell.innerHTML = jpStackHTML({ jp: kana, romaji: item.romaji, stackClass: "jp-stack-compact" });
    cell.addEventListener("click", () => { kanaIndex = KANA.indexOf(item); cardFlipped = false; renderKanaCard(); renderKanaChart($("#kanaSearch").value); });
    chart.appendChild(cell);
  });
}
function initKana() {
  $$(".segment").forEach(btn => btn.addEventListener("click", () => {
    $$(".segment").forEach(b => b.classList.remove("active")); btn.classList.add("active");
    kanaScript = btn.dataset.script; cardFlipped = false; renderKanaCard(); renderKanaChart($("#kanaSearch").value);
  }));
  $("#flashcard").addEventListener("click", () => { cardFlipped = !cardFlipped; renderKanaCard(); });
  $("#prevKana").addEventListener("click", () => { kanaIndex = (kanaIndex - 1 + KANA.length) % KANA.length; cardFlipped = false; renderKanaCard(); });
  $("#nextKana").addEventListener("click", () => { kanaIndex = (kanaIndex + 1) % KANA.length; cardFlipped = false; renderKanaCard(); });
  $("#speakKana").addEventListener("click", event => speak(currentKana()[kanaScript], event.currentTarget));
  $("#markKana").addEventListener("click", () => {
    const item = currentKana(); const kana = item[kanaScript]; const key = `${kanaScript}:${item.romaji}:${kana}`;
    if (!progress.knownKana.includes(key)) { progress.knownKana.push(key); recordStudy(2); }
    renderKanaCard(); renderKanaChart($("#kanaSearch").value);
  });
  $("#kanaSearch").addEventListener("input", e => renderKanaChart(e.target.value));
  renderKanaCard(); renderKanaChart();
}

/* ===== Kanji Explorer ===== */
function renderKanji() {
  const level = $("#kanjiLevelFilter").value;
  const query = $("#kanjiSearch").value.trim().toLowerCase();
  const grid = $("#kanjiGrid"); grid.innerHTML = "";
  const results = KANJI.filter(k => (level === "all" || k.level === level) && (`${k.char} ${k.onyomi} ${k.kunyomi} ${k.meaning} ${k.example}`.toLowerCase().includes(query)));
  if (!results.length) { grid.innerHTML = `<div class="empty-state">Tidak ada kanji yang cocok. Coba kata kunci lain.</div>`; return; }
  results.forEach(k => {
    const card = document.createElement("article"); card.className = "kanji-card";
    card.innerHTML = `<div class="kanji-level"><span class="badge">${levelById(k.level).code}</span></div>
      ${jpStackHTML({ jp: k.char, readings: [`<small>Onyomi</small>${k.onyomi}`, `<small>Kunyomi</small>${k.kunyomi}`], meaning: k.meaning, stackClass: "jp-stack-kanji" })}
      ${exampleStackHTML(k.example, "kanji-example")}`;
    card.appendChild(speakButton(k.char));
    grid.appendChild(card);
  });
}
function initKanji() {
  const select = $("#kanjiLevelFilter");
  LEVELS.filter(l => l.id !== "prep").forEach(l => { const opt = document.createElement("option"); opt.value = l.id; opt.textContent = l.code; select.appendChild(opt); });
  select.addEventListener("change", renderKanji); $("#kanjiSearch").addEventListener("input", renderKanji); renderKanji();
}

/* ===== Global Search ===== */
function renderSearch(query = "") {
  const box = $("#searchResults"); box.innerHTML = "";
  const q = query.trim().toLowerCase();
  if (!q) { box.innerHTML = `<div class="empty-state">Ketik kata kunci untuk mencari dari kosakata, kanji, dan grammar.</div>`; return; }
  const vocabResults = allVocab().filter(v => `${v.jp} ${v.reading} ${v.romaji} ${v.meaning}`.toLowerCase().includes(q)).slice(0, 12);
  const kanjiResults = KANJI.filter(k => `${k.char} ${k.onyomi} ${k.kunyomi} ${k.meaning} ${k.example}`.toLowerCase().includes(q)).slice(0, 8);
  const grammarResults = GRAMMAR_INDEX.filter(g => `${g.pattern} ${g.meaning} ${g.example}`.toLowerCase().includes(q)).slice(0, 8);
  vocabResults.forEach(v => { const el = document.createElement("div"); el.className = "result-card"; el.innerHTML = `<span class="badge">${v.level}</span>${jpStackHTML({ jp: v.jp, romaji: v.romaji, meaning: v.meaning, meta: `Dari: ${v.source}`, stackClass: "jp-stack-search" })}`; el.appendChild(speakButton(v.reading)); box.appendChild(el); });
  kanjiResults.forEach(k => { const el = document.createElement("div"); el.className = "result-card"; el.innerHTML = `<span class="badge">Kanji ${levelById(k.level).code}</span>${jpStackHTML({ jp: k.char, readings: [`<small>Onyomi</small>${k.onyomi}`, `<small>Kunyomi</small>${k.kunyomi}`], meaning: k.meaning, stackClass: "jp-stack-search" })}${exampleStackHTML(k.example, "kanji-example")}`; el.appendChild(speakButton(k.char)); box.appendChild(el); });
  grammarResults.forEach(g => { const el = document.createElement("div"); el.className = "result-card"; el.innerHTML = `<span class="badge">Grammar ${g.level.toUpperCase()}</span>${jpStackHTML({ jp: g.pattern, meaning: g.meaning, stackClass: "jp-stack-search" })}${translatedExampleHTML(g.example)}`; box.appendChild(el); });
  if (!vocabResults.length && !kanjiResults.length && !grammarResults.length) box.innerHTML = `<div class="empty-state">Tidak ditemukan. Coba romaji (taberu), arti Indonesia (makan), atau pola (はず).</div>`;
}

/* ===== Quiz ===== */
const QUIZ_CONFIG_KEY = "nihonGoMasterQuizConfigV1";
const QUIZ_TOPIC_LABELS = { kana: "Kana", vocab: "Kosakata", kanji: "Kanji", grammar: "Grammar", mixed: "Campuran" };
const QUIZ_TYPE_LABELS = { mc: "Pilihan ganda", type: "Ketik jawaban", listening: "Listening", mixed: "Campuran" };
let quiz = null;

function defaultQuizConfig() {
  return { topic: "kana", count: 10, level: "all", script: "mixed", type: "mc", showRomaji: true, shuffleOptions: true };
}
function loadQuizConfig() {
  try { return { ...defaultQuizConfig(), ...(JSON.parse(localStorage.getItem(QUIZ_CONFIG_KEY)) || {}) }; }
  catch { return defaultQuizConfig(); }
}
let quizConfig = loadQuizConfig();
function saveQuizConfig() { try { localStorage.setItem(QUIZ_CONFIG_KEY, JSON.stringify(quizConfig)); } catch { /* abaikan */ } }
function clampQuizCount(value) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return 10;
  return Math.min(30, Math.max(3, n));
}

/* --- Bank soal per topik/level --- */
function quizVocabPool(level) {
  return allModules().flatMap(m => m.vocab.map(v => ({ jp: v[0], reading: v[1], romaji: v[2], meaning: v[3], levelId: m.levelId, levelCode: m.levelCode, source: m.title })))
    .filter(v => level === "all" || v.levelId === level);
}
function quizKanjiPool(level) { return KANJI.filter(k => level === "all" || k.level === level); }
function quizGrammarPool(level) { return GRAMMAR_INDEX.filter(g => level === "all" || g.level === level); }
function quizTopicPoolSize(topic, cfg) {
  if (topic === "kana") return KANA.length;
  if (topic === "vocab") return quizVocabPool(cfg.level).length;
  if (topic === "kanji") return quizKanjiPool(cfg.level).length;
  if (topic === "grammar") return quizGrammarPool(cfg.level).length;
  return ["kana", "vocab", "kanji", "grammar"].reduce((sum, t) => sum + quizTopicPoolSize(t, cfg), 0);
}

/* --- Normalisasi jawaban ketik --- */
function normalizeTypedAnswer(value) {
  return String(value || "").toLowerCase().trim()
    .replace(/[.,;:!?'"“”‘’()\[\]{}<>〜~\-_\/\\|]/g, " ")
    .replace(/\s+/g, " ").trim();
}
function typedAnswerMatches(input, accepted) {
  const norm = normalizeTypedAnswer(input);
  if (!norm) return false;
  const compact = norm.replace(/\s/g, "");
  return (accepted || []).some(raw => {
    const a = normalizeTypedAnswer(raw);
    if (!a) return false;
    if (a === norm || a.replace(/\s/g, "") === compact) return true;
    // Kelonggaran wajar: jawaban benar berupa frasa panjang, pengguna mengetik bagian utamanya.
    return a.length >= 12 && norm.length >= 6 && a.includes(norm);
  });
}
function pickQuestionType(cfg) {
  if (cfg.type !== "mixed") return cfg.type;
  return sample(["mc", "type", "listening"], 1)[0];
}

/* --- Pembuat soal --- */
function buildQuizQuestion(topic, cfg) {
  const qType = pickQuestionType(cfg);
  if (topic === "kana") {
    const item = sample(KANA, 1)[0];
    const script = cfg.script === "mixed" ? sample(["hiragana", "katakana"], 1)[0] : cfg.script;
    const char = item[script];
    const scriptLabel = script === "hiragana" ? "Hiragana" : "Katakana";
    const wrong = sample(KANA.filter(k => k.romaji !== item.romaji), 3).map(k => k.romaji);
    return {
      topic, type: qType,
      prompt: `Apa romaji untuk ${scriptLabel.toLowerCase()} ini?`,
      display: char, displayJp: char, displayRomaji: "", reviewRomaji: item.romaji, displayMeta: scriptLabel, speakText: char,
      answer: item.romaji, accepted: [item.romaji],
      options: cfg.shuffleOptions ? shuffle([item.romaji, ...wrong]) : [item.romaji, ...wrong],
      explain: `${char} (${scriptLabel.toLowerCase()}) dibaca "${item.romaji}". Contoh kata: ${item.example[0]} (${item.example[1]}) — ${item.example[2]}.`
    };
  }
  if (topic === "vocab") {
    const pool = quizVocabPool(cfg.level); if (!pool.length) return null;
    const item = sample(pool, 1)[0];
    const wrong = sample(pool.filter(v => v.meaning !== item.meaning), 3).map(v => v.meaning);
    return {
      topic, type: qType,
      prompt: "Apa arti kata ini?",
      display: cfg.showRomaji ? `${item.jp} (${item.romaji})` : item.jp,
      displayJp: item.jp, displayRomaji: cfg.showRomaji ? item.romaji : "", reviewRomaji: item.romaji,
      displayMeta: `${item.levelCode} • dari: ${item.source}`, speakText: item.reading,
      answer: item.meaning, accepted: [item.meaning, ...item.meaning.split("/")],
      options: cfg.shuffleOptions ? shuffle([item.meaning, ...wrong]) : [item.meaning, ...wrong],
      explain: `${item.jp} (${item.romaji}) berarti "${item.meaning}" — dari pelajaran ${item.source} (${item.levelCode}).`
    };
  }
  if (topic === "kanji") {
    const pool = quizKanjiPool(cfg.level); if (!pool.length) return null;
    const item = sample(pool, 1)[0];
    const wrong = sample(pool.filter(k => k.meaning !== item.meaning), 3).map(k => k.meaning);
    return {
      topic, type: qType,
      prompt: "Apa arti kanji ini?",
      display: item.char,
      displayJp: item.char, displayRomaji: "", displayReadings: cfg.showRomaji ? [`<small>Onyomi</small>${item.onyomi}`, `<small>Kunyomi</small>${item.kunyomi}`] : [], reviewReadings: [`<small>Onyomi</small>${item.onyomi}`, `<small>Kunyomi</small>${item.kunyomi}`],
      displayMeta: cfg.showRomaji ? `On: ${item.onyomi} • Kun: ${item.kunyomi}` : "",
      speakText: item.char,
      answer: item.meaning, accepted: [item.meaning, ...item.meaning.split("/")],
      options: cfg.shuffleOptions ? shuffle([item.meaning, ...wrong]) : [item.meaning, ...wrong],
      explain: `${item.char} artinya "${item.meaning}". On: ${item.onyomi} • Kun: ${item.kunyomi}. Contoh: ${item.example}`
    };
  }
  const pool = quizGrammarPool(cfg.level); if (!pool.length) return null;
  const item = sample(pool, 1)[0];
  const wrong = sample(pool.filter(g => g.meaning !== item.meaning), 3).map(g => g.meaning);
  return {
    topic, type: qType,
    prompt: "Apa fungsi pola grammar ini?",
    display: item.pattern,
    displayJp: item.pattern, displayRomaji: "",
    displayMeta: item.level.toUpperCase(),
    speakText: (item.example || "").split("—")[0].trim() || null,
    answer: item.meaning, accepted: [item.meaning],
    options: cfg.shuffleOptions ? shuffle([item.meaning, ...wrong]) : [item.meaning, ...wrong],
    explain: `Pola ${item.pattern} berarti: ${item.meaning} Contoh: ${item.example}`
  };
}
function generateQuizQuestions(cfg) {
  const singleTopics = ["kana", "vocab", "kanji", "grammar"];
  const usableTopics = (cfg.topic === "mixed" ? singleTopics : [cfg.topic]).filter(t => quizTopicPoolSize(t, cfg) > 0);
  const available = cfg.topic === "mixed" ? quizTopicPoolSize("mixed", cfg) : quizTopicPoolSize(cfg.topic, cfg);
  const total = Math.min(clampQuizCount(cfg.count), available);
  const questions = [];
  let guard = 0;
  while (questions.length < total && guard < total * 40 + 80) {
    guard++;
    const topic = cfg.topic === "mixed" ? sample(usableTopics, 1)[0] : cfg.topic;
    const q = buildQuizQuestion(topic, cfg);
    if (q) questions.push(q);
  }
  return { questions, available };
}

/* --- Konfigurasi kuis (form) --- */
/* --- Panel kuis sebelum dimulai --- */
function quizSelectedOptionText(id) {
  const el = document.getElementById(id);
  if (!el || !el.options || el.selectedIndex < 0) return "";
  return el.options[el.selectedIndex].textContent.trim();
}
function renderQuizIdleState() {
  if (quiz) return;
  const panel = $("#quizPanel"); if (!panel) return;
  const cfg = {
    ...quizConfig,
    topic: $("#quizTopic") ? $("#quizTopic").value : quizConfig.topic,
    level: $("#quizLevel") ? $("#quizLevel").value : quizConfig.level,
    script: $("#quizScript") ? $("#quizScript").value : quizConfig.script,
    count: clampQuizCount($("#quizCount") ? $("#quizCount").value : quizConfig.count),
    type: $("#quizType") ? $("#quizType").value : quizConfig.type
  };
  const available = quizTopicPoolSize(cfg.topic, cfg);
  const used = Math.min(cfg.count, available);
  const scopeLabel = cfg.topic === "kana"
    ? quizSelectedOptionText("quizScript")
    : cfg.topic === "mixed"
      ? `${quizSelectedOptionText("quizLevel")} • ${quizSelectedOptionText("quizScript")}`
      : quizSelectedOptionText("quizLevel");
  const summary = available
    ? `${QUIZ_TOPIC_LABELS[cfg.topic]} • ${scopeLabel} • ${used} dari ${cfg.count} soal diminta • ${QUIZ_TYPE_LABELS[cfg.type]} • ${available} soal tersedia`
    : `${QUIZ_TOPIC_LABELS[cfg.topic]} • bank soal untuk pilihan ini masih kosong`;
  panel.innerHTML = `
    <div class="quiz-idle">
      <span class="idle-badge">${available ? "Siap mulai" : "Bank soal kosong"}</span>
      <h3>${available ? "Pengaturanmu sudah siap" : "Pilih kombinasi lain dulu"}</h3>
      <p class="quiz-idle-summary">${summary}</p>
      <p class="quiz-idle-hint">${available
        ? "Gunakan satu tombol <strong>Mulai kuis</strong> pada panel pengaturan di atas untuk menampilkan soal pertama."
        : "Kembali ke panel pengaturan di atas, lalu ganti topik atau level agar bank soalnya tersedia."}</p>
    </div>`;
}

function applyQuizConfigToForm() {
  $("#quizTopic").value = quizConfig.topic;
  $("#quizLevel").value = quizConfig.level;
  $("#quizScript").value = quizConfig.script;
  $("#quizCount").value = clampQuizCount(quizConfig.count);
  $("#quizType").value = quizConfig.type;
  $("#quizShowRomaji").checked = !!quizConfig.showRomaji;
  $("#quizShuffle").checked = !!quizConfig.shuffleOptions;
  updateQuizConfigVisibility(); updateQuizPoolNote();
}
function syncQuizConfigFromForm() {
  quizConfig = {
    topic: $("#quizTopic").value,
    count: clampQuizCount($("#quizCount").value),
    level: $("#quizLevel").value,
    script: $("#quizScript").value,
    type: $("#quizType").value,
    showRomaji: $("#quizShowRomaji").checked,
    shuffleOptions: $("#quizShuffle").checked
  };
  $("#quizCount").value = quizConfig.count;
  saveQuizConfig(); updateQuizConfigVisibility(); updateQuizPoolNote(); renderQuizIdleState();
}
function updateQuizConfigVisibility() {
  const topic = $("#quizTopic").value;
  $("#quizLevelWrap").hidden = topic === "kana";
  $("#quizScriptWrap").hidden = !(topic === "kana" || topic === "mixed");
}
function updateQuizPoolNote() {
  const note = $("#quizPoolNote"); if (!note) return;
  const cfg = { ...quizConfig, topic: $("#quizTopic").value, level: $("#quizLevel").value, count: clampQuizCount($("#quizCount").value) };
  const available = quizTopicPoolSize(cfg.topic, cfg);
  const used = Math.min(cfg.count, available);
  if (!available) {
    note.textContent = "Bank soal untuk kombinasi ini masih kosong. Coba ganti topik atau level (mis. N5).";
  } else if (used < cfg.count) {
    note.textContent = `Bank soal tersedia ${available} soal, jadi kuis ini memakai ${used} soal. Materi akan terus ditambah.`;
  } else {
    note.textContent = `Bank soal tersedia ${available} soal. Kuis memakai ${used} soal acak.`;
  }
  $("#startQuiz").disabled = !available;
}
function initQuizConfig() {
  applyQuizConfigToForm();
  renderQuizIdleState();
  ["quizTopic", "quizLevel", "quizScript", "quizCount", "quizType", "quizShowRomaji", "quizShuffle"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener("change", syncQuizConfigFromForm); });
}

/* --- Skor terbaik (kompatibel data lama berupa angka /10) --- */
function normalizeBestScore(entry) {
  if (entry == null) return null;
  if (typeof entry === "number") return { score: entry, total: 10, percent: Math.round(entry / 10 * 100) };
  if (typeof entry === "object" && typeof entry.score === "number") {
    const total = entry.total || 10;
    return { score: entry.score, total, percent: entry.percent != null ? entry.percent : Math.round(entry.score / total * 100) };
  }
  return null;
}
function renderBestScores() {
  const box = $("#bestScores"); if (!box) return;
  const parts = Object.keys(QUIZ_TOPIC_LABELS).map(key => {
    const best = normalizeBestScore(progress.bestScores[key]);
    return best ? `${QUIZ_TOPIC_LABELS[key]}: ${best.score}/${best.total} (${best.percent}%)` : null;
  }).filter(Boolean);
  box.innerHTML = `<strong>Skor terbaik</strong><br>` + (parts.length ? parts.join(" • ") : "Belum ada skor. Ikuti kuis pertamamu!");
}

/* --- Jalannya kuis --- */
function startQuiz() {
  syncQuizConfigFromForm();
  const { questions, available } = generateQuizQuestions(quizConfig);
  const panel = $("#quizPanel");
  if (!questions.length) {
    panel.innerHTML = `<div class="empty-state">Bank soal untuk pengaturan ini masih kosong. Coba ganti topik atau level (mis. N5), lalu mulai lagi.</div>`;
    return;
  }
  quiz = {
    config: { ...quizConfig }, index: 0, score: 0, questions, results: [],
    answered: false,
    note: questions.length < clampQuizCount(quizConfig.count) ? `Bank soal tersedia ${available}, jadi kuis ini berisi ${questions.length} soal.` : ""
  };
  progress.quizSessions += 1; saveProgress();
  renderQuizQuestion();
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function quizDisplayHTML(q) {
  const jpText = q.displayJp || q.display || "";
  const romajiText = q.displayRomaji || "";
  if (romajiText) return alignedRomajiHTML(jpText, romajiText, "", "jp-stack-quiz");
  return jpStackHTML({ jp: jpText, romaji: "", readings: q.displayReadings || [], meta: q.displayMeta || "", stackClass: "jp-stack-quiz" });
}
function renderQuizDots() {
  return quiz.questions.map((_, i) => {
    const res = quiz.results[i];
    const cls = res ? (res.correct ? "dot-correct" : "dot-wrong") : (i === quiz.index ? "dot-current" : "");
    return `<span class="quiz-dot ${cls}"></span>`;
  }).join("");
}
function renderQuizQuestion() {
  const panel = $("#quizPanel"); const q = quiz.questions[quiz.index]; quiz.answered = false;
  panel.innerHTML = `
    <p class="eyebrow">Soal ${quiz.index + 1} / ${quiz.questions.length} • Skor ${quiz.score} • ${QUIZ_TOPIC_LABELS[q.topic]}</p>
    <div class="quiz-dots" role="img" aria-label="Kemajuan jawaban kuis">${renderQuizDots()}</div>
    ${quiz.note ? `<p class="quiz-note">${quiz.note}</p>` : ""}
    <h3 class="quiz-question">${q.prompt}</h3>
    <div class="quiz-display"></div>
    <div class="quiz-answer-zone"></div>
    <div id="quizFeedback" class="quiz-feedback" aria-live="polite"></div>`;
  const display = $(".quiz-display", panel);
  display.classList.add("quiz-question-row");
  if (q.type === "listening") {
    const wrap = document.createElement("div"); wrap.className = "listening-box quiz-question-main";
    const hiddenText = document.createElement("p"); hiddenText.className = "listening-hidden jp"; hiddenText.id = "listeningHiddenText"; hiddenText.textContent = "• • •";
    hiddenText.setAttribute("aria-label", "Teks soal disembunyikan untuk latihan mendengar");
    const reveal = document.createElement("button"); reveal.type = "button"; reveal.className = "text-button small"; reveal.textContent = "Tampilkan teks";
    reveal.addEventListener("click", () => {
      hiddenText.innerHTML = quizDisplayHTML(q);
      reveal.hidden = true;
    });
    wrap.appendChild(hiddenText); wrap.appendChild(reveal);
    display.appendChild(wrap);
    display.appendChild(speakButton(q.speakText, "🔊 Dengarkan soal"));
  } else {
    const main = document.createElement("div"); main.className = "quiz-question-main";
    main.innerHTML = quizDisplayHTML(q);
    display.appendChild(main);
    if (q.speakText) display.appendChild(speakButton(q.speakText, "🔊 Dengar"));
  }
  const zone = $(".quiz-answer-zone", panel);
  if (q.type === "type") {
    zone.innerHTML = `
      <form class="type-form" id="quizTypeForm">
        <label class="field-label" for="quizTypeInput">Jawaban kamu</label>
        <input id="quizTypeInput" class="search-input answer-input" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Ketik jawaban di sini…">
        <button class="button primary wide" type="submit">Periksa jawaban</button>
      </form>`;
    $("#quizTypeForm", zone).addEventListener("submit", event => {
      event.preventDefault();
      if (quiz.answered) return;
      const input = $("#quizTypeInput", zone);
      const value = input.value;
      const correct = typedAnswerMatches(value, q.accepted && q.accepted.length ? q.accepted : [q.answer]);
      input.classList.add(correct ? "answer-correct" : "answer-wrong");
      input.disabled = true;
      recordQuizAnswer(value.trim() || "(kosong)", correct);
    });
    $("#quizTypeInput", zone).focus();
  } else {
    const options = document.createElement("div"); options.className = "quiz-options";
    q.options.forEach(option => {
      const btn = document.createElement("button"); btn.type = "button"; btn.className = "quiz-option"; btn.textContent = option; btn.dataset.value = option;
      btn.addEventListener("click", () => answerQuizChoice(btn, option));
      options.appendChild(btn);
    });
    zone.appendChild(options);
  }
}
function answerQuizChoice(button, option) {
  if (quiz.answered) return;
  const q = quiz.questions[quiz.index];
  const correct = option === q.answer;
  $$(".quiz-option").forEach(btn => {
    if (btn.dataset.value === q.answer) btn.classList.add("correct");
    else if (btn === button && !correct) btn.classList.add("wrong");
    else btn.classList.add("dimmed");
    btn.disabled = true;
  });
  recordQuizAnswer(option, correct);
}
function revealListeningText() {
  const q = quiz.questions[quiz.index];
  if (q.type !== "listening") return;
  const hiddenText = $("#listeningHiddenText");
  if (hiddenText) hiddenText.innerHTML = quizDisplayHTML(q);
  $$(".listening-box .text-button").forEach(btn => { btn.hidden = true; });
}
function recordQuizAnswer(userAnswer, correct) {
  quiz.answered = true;
  const q = quiz.questions[quiz.index];
  quiz.results[quiz.index] = { question: q, userAnswer, correct };
  if (correct) { quiz.score += 1; recordStudy(5); }
  revealListeningText();
  const dots = $(".quiz-dots"); if (dots) dots.innerHTML = renderQuizDots();
  const feedback = $("#quizFeedback");
  feedback.innerHTML = `
    <p>${correct ? `<span class="quiz-score">✓ Benar!</span> +5 XP` : `<span class="quiz-wrong-text">✗ Belum tepat.</span> Jawaban benar: <strong>${q.answer}</strong>`}</p>
    ${q.explain ? `<p class="quiz-explain">${q.explain}</p>` : ""}`;
  const next = document.createElement("button"); next.className = "button primary wide"; next.type = "button";
  next.textContent = quiz.index === quiz.questions.length - 1 ? "Lihat hasil" : "Soal berikutnya →";
  next.addEventListener("click", () => { quiz.index += 1; if (quiz.index >= quiz.questions.length) finishQuiz(); else renderQuizQuestion(); });
  feedback.appendChild(next);
  next.focus();
}
function finishQuiz() {
  const total = quiz.questions.length;
  const percent = total ? Math.round(quiz.score / total * 100) : 0;
  const key = quiz.config.topic;
  const previousBest = normalizeBestScore(progress.bestScores[key]);
  if (!previousBest || percent > previousBest.percent) {
    progress.bestScores[key] = { score: quiz.score, total, percent };
  }
  saveProgress(); renderBestScores(); renderDashboard();
  const message = percent >= 90 ? "Luar biasa! Kamu hampir menguasai materi ini. 🎉"
    : percent >= 70 ? "Bagus sekali! Tinggal poles sedikit lagi."
    : percent >= 50 ? "Lumayan! Lebih dari separuh benar — teruskan."
    : "Tidak apa-apa, ini bagian dari belajar. Coba baca lagi review di bawah, lalu ulangi ya.";
  const reviewCards = quiz.results.map((res, i) => {
    const q = res.question;
    const reviewRomajiText = q.topic === "kana" ? q.answer : (q.reviewRomaji || q.displayRomaji || "");
    const reviewStack = reviewRomajiText
      ? alignedRomajiHTML(q.displayJp || q.display, reviewRomajiText, q.topic === "kana" ? "" : q.answer, "jp-stack-review")
      : jpStackHTML({
          jp: q.displayJp || q.display,
          romaji: "",
          readings: q.reviewReadings || q.displayReadings || [],
          meaning: q.topic === "kana" ? "" : q.answer,
          stackClass: "jp-stack-review"
        });
    return `<article class="review-card ${res.correct ? "is-correct" : "is-wrong"}">
      <p class="review-head"><strong>Soal ${i + 1}</strong> <span class="badge">${QUIZ_TOPIC_LABELS[q.topic]}${q.type === "listening" ? " • Listening" : q.type === "type" ? " • Ketik" : ""}</span> <span class="${res.correct ? "ans-correct" : "ans-wrong"}">${res.correct ? "✓ Benar" : "✗ Salah"}</span></p>
      <p class="review-question">${q.prompt}</p>
      ${reviewStack}
      <p>Jawaban kamu: <span class="${res.correct ? "ans-correct" : "ans-wrong"}">${res.userAnswer}</span><br>Jawaban benar: <span class="ans-correct">${q.answer}</span></p>
      ${q.explain ? `<p class="meaning">${q.explain}</p>` : ""}
    </article>`;
  }).join("");
  $("#quizPanel").innerHTML = `
    <p class="eyebrow">Hasil kuis</p>
    <h3 class="quiz-question">Skor kamu: ${quiz.score} / ${total} (${percent}%)</h3>
    <p class="meaning">${message} XP dari jawaban benar sudah ditambahkan.</p>
    <div class="row-actions">
      <button class="button primary" id="restartQuiz" type="button">↻ Main lagi (pengaturan sama)</button>
      <button class="button ghost" id="editQuizConfig" type="button">⚙ Ubah pengaturan</button>
    </div>
    <h4 class="review-title">Review jawaban</h4>
    <div class="review-list">${reviewCards}</div>`;
  $("#restartQuiz").addEventListener("click", startQuiz);
  $("#editQuizConfig").addEventListener("click", () => {
    document.querySelector("#quiz").scrollIntoView({ behavior: "smooth" });
    const topicSelect = $("#quizTopic"); if (topicSelect) topicSelect.focus({ preventScroll: true });
  });
}


/* ===== Mobile nav ===== */
function initMobileNav() {
  const toggle = $("#menuToggle"); const menu = $("#mobileMenu"); if (!toggle || !menu) return;
  const close = () => { menu.hidden = true; toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Buka menu"); toggle.classList.remove("open"); };
  const open = () => { menu.hidden = false; toggle.setAttribute("aria-expanded", "true"); toggle.setAttribute("aria-label", "Tutup menu"); toggle.classList.add("open"); };
  toggle.addEventListener("click", () => (menu.hidden ? open() : close()));
  $$("a", menu).forEach(link => link.addEventListener("click", close));
  document.addEventListener("click", event => {
    if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) close();
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !menu.hidden) { close(); toggle.focus(); } });
}

/* ===== Init ===== */
function init() {
  initMobileNav();
  renderDashboard(); renderLevels(); initLessonFilter(); renderLessonList(); selectLesson(nextRecommended().id, false);
  initKana(); initKanji(); renderSearch(); renderBestScores();
  $("#globalSearch").addEventListener("input", e => renderSearch(e.target.value));
  initQuizConfig();
  $("#startQuiz").addEventListener("click", startQuiz);
  $("#speakHero").addEventListener("click", event => speak("日本語を勉強しましょう。", event.currentTarget));
  $("#startPrep").addEventListener("click", event => {
    event.preventDefault();
    const firstPrep = allModules().find(module => module.levelId === "prep") || nextRecommended();
    $("#lessonLevelFilter").value = "prep";
    selectLesson(firstPrep.id, true);
  });
  $("#resetProgress").addEventListener("click", () => {
    if (confirm("Reset semua progres lokal di browser ini?")) { progress = defaultProgress(); saveProgress(); location.reload(); }
  });
  if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
}
document.addEventListener("DOMContentLoaded", init);
