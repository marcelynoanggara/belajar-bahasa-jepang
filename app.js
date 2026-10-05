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
function speak(text) {
  if (!("speechSynthesis" in window)) { alert("Browser ini tidak mendukung Web Speech API."); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/\s+/g, " ").trim());
  utterance.lang = "ja-JP"; utterance.rate = 0.88;
  const voice = window.speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith("ja"));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}
function speakButton(text, label = "🔊") {
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "speak-btn"; btn.textContent = label;
  btn.setAttribute("aria-label", `Dengarkan: ${text}`); btn.addEventListener("click", () => speak(text)); return btn;
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
  LEVELS.forEach((level, index) => {
    const percent = completionForLevel(level);
    const unlocked = isLevelUnlocked(index);
    const card = document.createElement("article");
    card.className = `level-card ${unlocked ? "" : "locked"}`; card.style.setProperty("--level-color", level.color);
    card.innerHTML = `
      <div class="level-icon" aria-hidden="true">${level.icon}</div>
      <div class="level-meta"><span>${level.code}</span><span>${percent}% selesai</span></div>
      <h3>${level.name}</h3><p>${level.description}</p>
      <div class="mini-bar" aria-hidden="true"><span style="width:${percent}%"></span></div>
      <p style="margin-top:12px"><span class="badge ${percent === 100 ? "done" : unlocked ? "" : "lock"}">${percent === 100 ? "Selesai" : unlocked ? "Terbuka" : "Terkunci — selesaikan 60% level sebelumnya"}</span></p>
      <button class="button ghost small" type="button">Lihat ${level.modules.length} modul</button>`;
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
    card.appendChild(speakButton(jp));
    card.innerHTML += `<div class="example-jp jp">${jp}</div><div class="romaji">${romaji}</div><div class="meaning">${meaning}</div>`;
    examples.appendChild(card);
  });
  const vocab = $(".vocab-list", panel);
  module.vocab.forEach(([jp, reading, romaji, meaning]) => {
    const card = document.createElement("div"); card.className = "vocab-card";
    card.appendChild(speakButton(reading));
    card.innerHTML += `<strong class="jp">${jp}</strong> <span class="romaji">${romaji}</span><div class="meaning">${meaning} • bacaan: ${reading}</div>`;
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
  $("#cardExample").textContent = `${item.example[0]} (${item.example[1]}) — ${item.example[2]}`;
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
    cell.innerHTML = `<b class="jp">${kana}</b><span>${item.romaji}</span>`;
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
  $("#speakKana").addEventListener("click", () => speak(currentKana()[kanaScript]));
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
    card.appendChild(speakButton(k.char));
    card.innerHTML += `<div class="kanji-char jp">${k.char}</div><span class="badge">${levelById(k.level).code}</span>
      <dl><dt>Onyomi</dt><dd>${k.onyomi}</dd><dt>Kunyomi</dt><dd>${k.kunyomi}</dd><dt>Arti</dt><dd>${k.meaning}</dd></dl>
      <p class="meaning">${k.example}</p>`;
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
  vocabResults.forEach(v => { const el = document.createElement("div"); el.className = "result-card"; el.appendChild(speakButton(v.reading)); el.innerHTML += `<span class="badge">${v.level}</span><h3 class="jp">${v.jp}</h3><p><span class="romaji">${v.romaji}</span><br><span class="meaning">${v.meaning} • dari: ${v.source}</span></p>`; box.appendChild(el); });
  kanjiResults.forEach(k => { const el = document.createElement("div"); el.className = "result-card"; el.appendChild(speakButton(k.char)); el.innerHTML += `<span class="badge">Kanji ${levelById(k.level).code}</span><h3 class="jp">${k.char}</h3><p class="meaning">${k.meaning}<br>On: ${k.onyomi} • Kun: ${k.kunyomi}<br>${k.example}</p>`; box.appendChild(el); });
  grammarResults.forEach(g => { const el = document.createElement("div"); el.className = "result-card"; el.innerHTML = `<span class="badge">Grammar ${g.level.toUpperCase()}</span><h3 class="jp">${g.pattern}</h3><p class="meaning">${g.meaning}<br>${g.example}</p>`; box.appendChild(el); });
  if (!vocabResults.length && !kanjiResults.length && !grammarResults.length) box.innerHTML = `<div class="empty-state">Tidak ditemukan. Coba romaji (taberu), arti Indonesia (makan), atau pola (はず).</div>`;
}

/* ===== Quiz ===== */
let quiz = null;
function makeQuestion(mode) {
  if (mode === "kana") {
    const item = KANA[Math.floor(Math.random() * KANA.length)]; const script = Math.random() > 0.5 ? "hiragana" : "katakana";
    const wrong = sample(KANA.filter(k => k.romaji !== item.romaji), 3).map(k => k.romaji);
    return { prompt: `Apa romaji untuk ${item[script]} (${script})?`, display: item[script], answer: item.romaji, options: shuffle([item.romaji, ...wrong]) };
  }
  if (mode === "vocab") {
    const vocab = allVocab(); const item = vocab[Math.floor(Math.random() * vocab.length)];
    const wrong = sample(vocab.filter(v => v.meaning !== item.meaning), 3).map(v => v.meaning);
    return { prompt: `Apa arti kata ini?`, display: `${item.jp} (${item.romaji})`, answer: item.meaning, options: shuffle([item.meaning, ...wrong]), speakText: item.reading };
  }
  if (mode === "kanji") {
    const item = KANJI[Math.floor(Math.random() * KANJI.length)];
    const wrong = sample(KANJI.filter(k => k.meaning !== item.meaning), 3).map(k => k.meaning);
    return { prompt: `Apa arti kanji ini?`, display: item.char, answer: item.meaning, options: shuffle([item.meaning, ...wrong]), speakText: item.char };
  }
  const item = GRAMMAR_INDEX[Math.floor(Math.random() * GRAMMAR_INDEX.length)];
  const wrong = sample(GRAMMAR_INDEX.filter(g => g.meaning !== item.meaning), 3).map(g => g.meaning);
  return { prompt: `Apa fungsi pola grammar ini?`, display: item.pattern, answer: item.meaning, options: shuffle([item.meaning, ...wrong]) };
}
function startQuiz() {
  const mode = $("#quizMode").value;
  quiz = { mode, index: 0, score: 0, questions: Array.from({ length: 10 }, () => makeQuestion(mode)), answered: false };
  progress.quizSessions += 1; saveProgress(); renderQuizQuestion();
}
function renderQuizQuestion() {
  const panel = $("#quizPanel"); const q = quiz.questions[quiz.index]; quiz.answered = false;
  panel.innerHTML = `<p class="eyebrow">Soal ${quiz.index + 1} / ${quiz.questions.length} • Skor ${quiz.score}</p><h3 class="quiz-question">${q.prompt}</h3><p class="example-jp jp">${q.display}</p><div class="quiz-options"></div><p id="quizFeedback" class="meaning"></p>`;
  if (q.speakText || quiz.mode === "kana") panel.querySelector("h3").insertAdjacentElement("afterend", speakButton(q.speakText || q.display, "🔊 Dengar soal"));
  const options = $(".quiz-options", panel);
  q.options.forEach(option => {
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "quiz-option"; btn.textContent = option;
    btn.addEventListener("click", () => answerQuiz(btn, option)); options.appendChild(btn);
  });
}
function answerQuiz(button, option) {
  if (quiz.answered) return; quiz.answered = true;
  const q = quiz.questions[quiz.index]; const correct = option === q.answer;
  if (correct) { quiz.score += 1; recordStudy(5); }
  $$(".quiz-option").forEach(btn => { if (btn.textContent === q.answer) btn.classList.add("correct"); if (btn === button && !correct) btn.classList.add("wrong"); btn.disabled = true; });
  const feedback = $("#quizFeedback");
  feedback.innerHTML = correct ? `<span class="quiz-score">Benar!</span> +5 XP` : `Belum tepat. Jawaban benar: <strong>${q.answer}</strong>`;
  const next = document.createElement("button"); next.className = "button primary wide"; next.type = "button"; next.textContent = quiz.index === quiz.questions.length - 1 ? "Lihat hasil" : "Soal berikutnya";
  next.addEventListener("click", () => { quiz.index += 1; if (quiz.index >= quiz.questions.length) finishQuiz(); else renderQuizQuestion(); });
  feedback.insertAdjacentElement("afterend", next);
}
function finishQuiz() {
  const mode = quiz.mode; const previousBest = progress.bestScores[mode] || 0;
  progress.bestScores[mode] = Math.max(previousBest, quiz.score); saveProgress(); renderBestScores(); renderDashboard();
  $("#quizPanel").innerHTML = `<p class="eyebrow">Hasil kuis</p><h3 class="quiz-question">Skor kamu: ${quiz.score} / ${quiz.questions.length}</h3><p class="meaning">Skor terbaik mode ${mode}: ${progress.bestScores[mode]} / 10. XP dari jawaban benar sudah ditambahkan.</p><button class="button primary wide" id="restartQuiz" type="button">Main lagi</button>`;
  $("#restartQuiz").addEventListener("click", startQuiz);
}
function renderBestScores() {
  const labels = { kana: "Kana", vocab: "Kosakata", kanji: "Kanji", grammar: "Grammar" };
  $("#bestScores").innerHTML = `<strong>Skor terbaik</strong><br>` + Object.keys(labels).map(k => `${labels[k]}: ${progress.bestScores[k] || 0}/10`).join(" • ");
}

/* ===== Init ===== */
function init() {
  renderDashboard(); renderLevels(); initLessonFilter(); renderLessonList(); selectLesson(nextRecommended().id, false);
  initKana(); initKanji(); renderSearch(); renderBestScores();
  $("#globalSearch").addEventListener("input", e => renderSearch(e.target.value));
  $("#startQuiz").addEventListener("click", startQuiz);
  $("#speakHero").addEventListener("click", () => speak("日本語を勉強しましょう。"));
  $("#resetProgress").addEventListener("click", () => {
    if (confirm("Reset semua progres lokal di browser ini?")) { progress = defaultProgress(); saveProgress(); location.reload(); }
  });
  if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
}
document.addEventListener("DOMContentLoaded", init);
