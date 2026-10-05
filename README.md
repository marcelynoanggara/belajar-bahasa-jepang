# NihonGo Master — Belajar Bahasa Jepang 0 sampai N1

Aplikasi web statis berbahasa Indonesia untuk belajar bahasa Jepang dari fondasi sampai JLPT N1. Dibangun tanpa build step sehingga dapat langsung dibuka atau dideploy ke GitHub Pages.

## Fitur versi pertama

- Dashboard pribadi dengan progres keseluruhan, XP, streak belajar, rekomendasi pelajaran berikutnya, dan penyimpanan otomatis melalui `localStorage`.
- Roadmap lengkap: Persiapan, N5, N4, N3, N2, dan N1. Level berikutnya terbuka setelah minimal 60% modul level sebelumnya selesai.
- Pelajaran interaktif untuk 30 modul inti: pengantar materi, fokus grammar, pola utama, contoh kalimat ber-audio, kosakata, dan tombol tandai selesai.
- Kana trainer untuk hiragana dan katakana: flashcard flip, navigasi kartu, penanda kana dikuasai, tabel kana, dan pencarian.
- Kanji explorer: contoh kanji per level N5–N1 dengan onyomi, kunyomi, arti Indonesia, contoh kata, filter level, dan pencarian.
- Kuis acak 10 soal untuk kana, kosakata, kanji, dan grammar dengan skor, XP, dan skor terbaik lokal.
- Pencarian terpadu kosakata, kanji, dan grammar.
- Audio pengucapan bahasa Jepang diputar dari file MP3 same-origin di `assets/audio/` melalui `audio-map.js`; jika teks belum terpetakan, aplikasi mencadangkan ke Google Translate TTS lalu Web Speech API (`ja-JP`).

## Status kurikulum

Versi pertama berisi roadmap lengkap dan bank inti yang dapat langsung dimainkan di semua level. Ini bukan klaim bahwa seluruh ribuan kosakata/kanji setara JLPT sudah habis dimuat. Daftar kosakata resmi JLPT tidak diterbitkan sebagai satu daftar tunggal oleh penyelenggara; karena itu bank materi aplikasi ini adalah kurikulum inti terkurasi yang disiapkan untuk diperluas bertahap, bukan halaman placeholder kosong.

Ruang perluasan berikutnya yang disarankan:

1. Tambah paket kosakata dan kanji per topik di setiap level.
2. Tambah latihan listening terpisah dan input jawaban tulis.
3. Tambah urutan coretan kanji dan SRS terjadwal per kartu.
4. Tambah simulasi ujian berdurasi penuh per level.

## Menjalankan lokal

Cara paling sederhana, jalankan static server di root repository:

```bash
python3 -m http.server 8000
```

Lalu buka:

```text
http://localhost:8000
```

Alternatif: gunakan ekstensi static server editor favoritmu. File juga dapat dibuka langsung, tetapi server lokal lebih mendekati perilaku GitHub Pages.

## Deploy GitHub Pages

Repository ini menyertakan workflow:

```text
.github/workflows/deploy.yml
```

Workflow berjalan saat ada push ke branch `main`, memakai `actions/configure-pages`, `actions/upload-pages-artifact` dengan path `.`, dan `actions/deploy-pages`. Di pengaturan repository GitHub, pastikan Pages menggunakan sumber **GitHub Actions**.

## Struktur file

```text
.
├── index.html                    # Kerangka aplikasi satu halaman
├── styles.css                    # Desain responsif bernuansa indigo, shu-iro, krem
├── data.js                       # Data kana, kurikulum 0–N1, kanji, grammar
├── app.js                        # Dashboard, progres lokal, pelajaran, kuis, pencarian
└── .github/workflows/deploy.yml  # Deploy otomatis GitHub Pages
```

## Privasi progres

Tidak ada akun dan tidak ada data yang dikirim ke server aplikasi. Progres disimpan hanya di `localStorage` browser/perangkat yang dipakai, sehingga berpindah browser atau membersihkan data situs akan menghapus progres lokal.
