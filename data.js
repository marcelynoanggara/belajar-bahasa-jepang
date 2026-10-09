"use strict";

/* ===== KANA DATA ===== */
function parseKanaPairs(text) {
  return text.trim().split(/\s+/).map(token => ({ kana: token.slice(0, -0), raw: token }));
}
function kanaEntries(hiraganaText, katakanaText, romajiText, group) {
  const h = hiraganaText.trim().split(/\s+/);
  const k = katakanaText.trim().split(/\s+/);
  const r = romajiText.trim().split(/\s+/);
  return r.map((romaji, i) => ({ hiragana: h[i], katakana: k[i], romaji, group }));
}

const KANA_EXAMPLES = {
  a:["あい","ai","cinta"], i:["いぬ","inu","anjing"], u:["うみ","umi","laut"], e:["えき","eki","stasiun"], o:["おかね","okane","uang"],
  ka:["かぜ","kaze","angin"], ki:["き","ki","pohon"], ku:["くも","kumo","awan"], ke:["ケーキ","kēki","kue"], ko:["ここ","koko","di sini"],
  sa:["さくら","sakura","bunga sakura"], shi:["しお","shio","garam"], su:["すし","sushi","sushi"], se:["せんせい","sensei","guru"], so:["そら","sora","langit"],
  ta:["たべもの","tabemono","makanan"], chi:["ちず","chizu","peta"], tsu:["つき","tsuki","bulan"], te:["てがみ","tegami","surat"], to:["とり","tori","burung"],
  na:["なつ","natsu","musim panas"], ni:["にほん","Nihon","Jepang"], nu:["ぬの","nuno","kain"], ne:["ねこ","neko","kucing"], no:["のみもの","nomimono","minuman"],
  ha:["はな","hana","bunga"], hi:["ひるごはん","hirugohan","makan siang"], fu:["ふね","fune","kapal"], he:["へや","heya","kamar"], ho:["ほし","hoshi","bintang"],
  ma:["まち","machi","kota"], mi:["みず","mizu","air"], mu:["むし","mushi","serangga"], me:["めがね","megane","kacamata"], mo:["もも","momo","persik"],
  ya:["やま","yama","gunung"], yu:["ゆき","yuki","salju"], yo:["よる","yoru","malam"],
  ra:["らいねん","rainen","tahun depan"], ri:["りんご","ringo","apel"], ru:["るす","rusu","ketidakhadiran"], re:["レモン","remon","lemon"], ro:["ろうそく","rōsoku","lilin"],
  wa:["わたし","watashi","saya"], wo:["ほんを よむ","hon o yomu","membaca buku"], n:["ほん","hon","buku"],
  ga:["がくせい","gakusei","pelajar"], gi:["ぎんこう","ginkō","bank"], gu:["ぐあい","guai","kondisi"], ge:["げんき","genki","sehat/bersemangat"], go:["ごはん","gohan","nasi/makan"],
  za:["ざっし","zasshi","majalah"], ji:["じかん","jikan","waktu"], zu:["ずぼん","zubon","celana"], ze:["ぜんぶ","zenbu","semua"], zo:["ぞう","zō","gajah"],
  da:["だいがく","daigaku","universitas"], de:["でんしゃ","densha","kereta"], do:["どうぶつ","dōbutsu","hewan"],
  ba:["ばんごはん","bangohan","makan malam"], bi:["びょういん","byōin","rumah sakit"], bu:["ぶんぼうぐ","bunbōgu","alat tulis"], be:["ベッド","beddo","tempat tidur"], bo:["ぼうし","bōshi","topi"],
  pa:["パン","pan","roti"], pi:["ピアノ","piano","piano"], pu:["プール","pūru","kolam renang"], pe:["ペン","pen","pena"], po:["ポスト","posuto","kotak pos"]
};

const KANA = [
  ...kanaEntries("あ い う え お","ア イ ウ エ オ","a i u e o","vokal"),
  ...kanaEntries("か き く け こ","カ キ ク ケ コ","ka ki ku ke ko","K"),
  ...kanaEntries("さ し す せ そ","サ シ ス セ ソ","sa shi su se so","S"),
  ...kanaEntries("た ち つ て と","タ チ ツ テ ト","ta chi tsu te to","T"),
  ...kanaEntries("な に ぬ ね の","ナ ニ ヌ ネ ノ","na ni nu ne no","N"),
  ...kanaEntries("は ひ ふ へ ほ","ハ ヒ フ ヘ ホ","ha hi fu he ho","H"),
  ...kanaEntries("ま み む め も","マ ミ ム メ モ","ma mi mu me mo","M"),
  ...kanaEntries("や ゆ よ","ヤ ユ ヨ","ya yu yo","Y"),
  ...kanaEntries("ら り る れ ろ","ラ リ ル レ ロ","ra ri ru re ro","R"),
  ...kanaEntries("わ を ん","ワ ヲ ン","wa wo n","W/N"),
  ...kanaEntries("が ぎ ぐ げ ご","ガ ギ グ ゲ ゴ","ga gi gu ge go","G (dakuten)"),
  ...kanaEntries("ざ じ ず ぜ ぞ","ザ ジ ズ ゼ ゾ","za ji zu ze zo","Z (dakuten)"),
  ...kanaEntries("だ ぢ づ で ど","ダ ヂ ヅ デ ド","da ji zu de do","D (dakuten)"),
  ...kanaEntries("ば び ぶ べ ぼ","バ ビ ブ ベ ボ","ba bi bu be bo","B (dakuten)"),
  ...kanaEntries("ぱ ぴ ぷ ぺ ぽ","パ ピ プ ペ ポ","pa pi pu pe po","P (handakuten)")
];
KANA.forEach(item => { item.example = KANA_EXAMPLES[item.romaji] || ["ことば","kotoba","kata"]; });

/* ===== CURRICULUM DATA =====
   Setiap modul berisi materi nyata: fokus, pola, contoh, dan kosakata.
   Ini bank inti v1 yang dapat diperluas per level. */
const LEVELS = [
  {
    id:"prep", code:"Persiapan", name:"Fondasi dari Nol", color:"#2f5aa6", icon:"あ",
    description:"Bunyi, kana, salam, angka, dan keberanian membuat kalimat pertama.",
    modules:[
      {id:"prep-sound", title:"Bunyi & ritme bahasa Jepang", type:"Pengantar", minutes:12, xp:20, intro:"Bahasa Jepang memiliki lima vokal stabil a-i-u-e-o dan ritme berbasis mora. Ucapkan setiap suku kata sama panjang.", focus:["Vokal pendek vs panjang: おばさん (bibi) berbeda dari おばあさん (nenek).","つ kecil (っ) menahan satu ketukan: きて vs きって.","Nasal ん berubah mengikuti bunyi sesudahnya."], pattern:"a • i • u • e • o — ucapkan jelas, pendek, dan rata.", examples:[["おはよう。","Ohayō.","Selamat pagi."],["ありがとうございます。","Arigatō gozaimasu.","Terima kasih banyak."],["すみません。","Sumimasen.","Permisi / maaf."]], vocab:[["はい","はい","hai","ya"],["いいえ","いいえ","iie","tidak"],["おはようございます","おはようございます","ohayō gozaimasu","selamat pagi"],["こんばんは","こんばんは","konbanwa","selamat malam"]]},
      {id:"prep-hiragana", title:"Menguasai Hiragana", type:"Kana", minutes:35, xp:40, intro:"Hiragana dipakai untuk kata asli Jepang, partikel, dan akhiran kata kerja. Pelajari per baris sambil menulis urutan coretannya.", focus:["46 kana dasar adalah fondasi; dakuten menambah bunyi bersuara.","Furigana adalah kana kecil di atas kanji untuk menunjukkan bacaan.","Tandai kana yang sudah dikenal di Kana Trainer."], pattern:"あ a • か ka • さ sa • た ta • な na • は ha • ま ma • や ya • ら ra • わ wa", examples:[["さくらが さきます。","Sakura ga sakimasu.","Bunga sakura mekar."],["ねこが います。","Neko ga imasu.","Ada seekor kucing."],["みずを のみます。","Mizu o nomimasu.","Saya minum air."]], vocab:[["あめ","あめ","ame","hujan"],["いぬ","いぬ","inu","anjing"],["うみ","うみ","umi","laut"],["えき","えき","eki","stasiun"]]},
      {id:"prep-katakana", title:"Menguasai Katakana", type:"Kana", minutes:35, xp:40, intro:"Katakana dipakai untuk kata serapan, nama asing, onomatope, dan penekanan. Bentuknya lebih tegas dan bersudut.", focus:["コーヒー, パソコン, dan テレビ adalah kata serapan umum.","Tanda ー memanjangkan vokal: ケーキ kēki.","Kombinasi kecil seperti キャ kya akan ditemui setelah kana dasar stabil."], pattern:"ア a • カ ka • サ sa • タ ta • ナ na • ハ ha • マ ma • ヤ ya • ラ ra • ワ wa", examples:[["コーヒーを ください。","Kōhii o kudasai.","Tolong kopi."],["これは テレビです。","Kore wa terebi desu.","Ini televisi."],["パソコンを かいます。","Pasokon o kaimasu.","Saya membeli komputer."]], vocab:[["コーヒー","コーヒー","kōhii","kopi"],["パン","パン","pan","roti"],["テレビ","テレビ","terebi","televisi"],["ホテル","ホテル","hoteru","hotel"]]},
      {id:"prep-greetings", title:"Salam & perkenalan diri", type:"Percakapan", minutes:20, xp:30, intro:"Perkenalan dasar memakai pola X は Y です. Tambahkan よろしく おねがいします untuk kesan sopan.", focus:["はじめまして dipakai saat pertama bertemu.","どうぞ よろしく おねがいします menutup perkenalan dengan sopan.","〜から きました berarti berasal dari…"], pattern:"わたしは [nama] です。[negara]から きました。", examples:[["はじめまして。わたしは マルセルです。","Hajimemashite. Watashi wa Maruseru desu.","Perkenalkan. Saya Marcel."],["インドネシアから きました。","Indoneshia kara kimashita.","Saya berasal dari Indonesia."],["どうぞ よろしく おねがいします。","Dōzo yoroshiku onegaishimasu.","Senang berkenalan dengan Anda."]], vocab:[["わたし","わたし","watashi","saya"],["なまえ","なまえ","namae","nama"],["くに","くに","kuni","negara"],["せんせい","せんせい","sensei","guru"]]},
      {id:"prep-numbers", title:"Angka, harga & waktu dasar", type:"Angka", minutes:25, xp:30, intro:"Angka Jepang memakai penghitung yang berubah menurut benda. Mulai dari angka murni, harga, dan jam.", focus:["1–10: いち, に, さん, よん/し, ご, ろく, なな/しち, はち, きゅう/く, じゅう.","〜えん untuk harga, 〜じ untuk jam, 〜ふん/ぷん untuk menit.","ひとつ, ふたつ, みっつ dipakai menghitung benda umum kecil."], pattern:"いま なんじですか。— [angka]じです。", examples:[["いま さんじです。","Ima sanji desu.","Sekarang jam tiga."],["これは ごひゃくえんです。","Kore wa gohyaku en desu.","Ini 500 yen."],["りんごを みっつ ください。","Ringo o mittsu kudasai.","Tolong tiga buah apel."]], vocab:[["いち","いち","ichi","satu"],["に","に","ni","dua"],["さん","さん","san","tiga"],["じかん","じかん","jikan","waktu/jam (durasi)"]]}
    ]
  },
  {
    id:"n5", code:"N5", name:"Pemula Dasar", color:"#c8402a", icon:"五",
    description:"Kalimat sederhana, partikel inti, kata kerja sopan, kata sifat, dan topik harian.",
    modules:[
      {id:"n5-particles-core", title:"Partikel は・が・を", type:"Grammar", minutes:30, xp:35, intro:"は menandai topik, が menandai subjek/fokus, dan を menandai objek langsung.", focus:["は dibaca wa saat menjadi partikel.","が sering memperkenalkan informasi baru atau menekankan pelaku.","を dibaca o saat menjadi partikel objek."], pattern:"[Topik] は [Subjek] が [Objek] を [Kata kerja].", examples:[["わたしは ほんを よみます。","Watashi wa hon o yomimasu.","Saya membaca buku."],["ねこが さかなを たべます。","Neko ga sakana o tabemasu.","Kucing makan ikan."],["これは わたしの かばんです。","Kore wa watashi no kaban desu.","Ini tas saya."]], vocab:[["ほん","ほん","hon","buku"],["さかな","さかな","sakana","ikan"],["かばん","かばん","kaban","tas"],["たべます","たべます","tabemasu","makan (sopan)"]]},
      {id:"n5-particles-place", title:"Partikel に・へ・で・と・も", type:"Grammar", minutes:30, xp:35, intro:"Partikel tempat dan pendamping: に tujuan/waktu, へ arah, で tempat aktivitas/alat, と bersama/dan, も juga.", focus:["学校に 行きます: tujuan. 学校で 勉強します: tempat aktivitas.","電車で 行きます: alat/kendaraan dengan で.","友達と 話します: bersama teman."], pattern:"[tempat/orang] に/へ • [tempat/alat] で • [orang] と • [X] も", examples:[["がっこうに いきます。","Gakkō ni ikimasu.","Saya pergi ke sekolah."],["としょかんで べんきょうします。","Toshokan de benkyō shimasu.","Saya belajar di perpustakaan."],["ともだちと はなします。","Tomodachi to hanashimasu.","Saya berbicara dengan teman."]], vocab:[["がっこう","がっこう","gakkō","sekolah"],["としょかん","としょかん","toshokan","perpustakaan"],["ともだち","ともだち","tomodachi","teman"],["いきます","いきます","ikimasu","pergi"]]},
      {id:"n5-verbs", title:"Kata kerja bentuk ます", type:"Grammar", minutes:35, xp:40, intro:"Bentuk ます adalah bentuk sopan aman untuk percakapan sehari-hari. Pelajari sekarang, lampau, negatif, dan tanya.", focus:["食べます makan, 食べません tidak makan, 食べました makan (lampau).","Kata kerja する menjadi します; 来る menjadi 来ます (kimasu). ","〜ませんか mengajak dengan sopan."], pattern:"[Akar kata kerja] + ます / ません / ました / ませんでした", examples:[["あさごはんを たべました。","Asagohan o tabemashita.","Saya sudah makan sarapan."],["あした にほんごを べんきょうします。","Ashita Nihongo o benkyō shimasu.","Besok saya belajar bahasa Jepang."],["いっしょに いきませんか。","Issho ni ikimasen ka.","Maukah pergi bersama?"]], vocab:[["あさごはん","あさごはん","asagohan","sarapan"],["あした","あした","ashita","besok"],["にほんご","にほんご","Nihongo","bahasa Jepang"],["のみます","のみます","nomimasu","minum"]]},
      {id:"n5-adjectives", title:"Kata sifat い dan な", type:"Grammar", minutes:30, xp:35, intro:"Kata sifat い berubah bentuk; kata sifat な membutuhkan な sebelum kata benda dan だ/です dalam predikat.", focus:["大きいです besar; 大きくないです tidak besar; 大きかったです besar (lampau).","有名な人 orang terkenal; 静かです tenang.","とても sangat, あまり + negatif = tidak terlalu."], pattern:"[Kata sifat-い] です • [Kata sifat-な] な [kata benda] です", examples:[["この へやは おおきいです。","Kono heya wa ōkii desu.","Kamar ini besar."],["かれは ゆうめいな ひとです。","Kare wa yūmei na hito desu.","Dia orang terkenal."],["きょうは あつくないです。","Kyō wa atsukunai desu.","Hari ini tidak panas."]], vocab:[["おおきい","おおきい","ōkii","besar"],["ゆうめい","ゆうめい","yūmei","terkenal"],["あつい","あつい","atsui","panas"],["へや","へや","heya","kamar"]]},
      {id:"n5-daily", title:"Kalimat harian & bertanya", type:"Percakapan", minutes:30, xp:35, intro:"Gabungkan waktu, frekuensi, pertanyaan apa/siapa/di mana, dan ajakan sederhana.", focus:["何 (nani/nan), 誰 dare, どこ doko, いつ itsu, いくら ikura.","毎日 mainichi, よく yoku, 時々 tokidoki, あまり amari.","〜たいです menyatakan ingin melakukan."], pattern:"[Waktu] [objek] を [kata kerja] たいです。", examples:[["まいあさ コーヒーを のみます。","Maiasa kōhii o nomimasu.","Setiap pagi saya minum kopi."],["にほんへ いきたいです。","Nihon e ikitai desu.","Saya ingin pergi ke Jepang."],["それは いくらですか。","Sore wa ikura desu ka.","Itu berapa harganya?"]], vocab:[["まいあさ","まいあさ","maiasa","setiap pagi"],["いきたい","いきたい","ikitai","ingin pergi"],["いくら","いくら","ikura","berapa harga"],["それ","それ","sore","itu (dekat lawan bicara)"]]}
    ]
  },
  {
    id:"n4", code:"N4", name:"Pemula Menengah", color:"#0f766e", icon:"四",
    description:"Bentuk kamus, て/た/ない, syarat, kemampuan, rencana, dan percakapan lebih fleksibel.",
    modules:[
      {id:"n4-te", title:"Bentuk て: rangkaian & permintaan", type:"Grammar", minutes:40, xp:45, intro:"Bentuk て menghubungkan tindakan, meminta tolong, memberi izin, dan menyatakan keadaan berlangsung.", focus:["食べてください tolong makan / silakan makan.","本を読んでいます sedang membaca atau keadaan berlanjut.","A て B て C menghubungkan beberapa tindakan berurutan."], pattern:"[Kata kerja-て] ください / います / も いいです", examples:[["ちょっと まってください。","Chotto matte kudasai.","Tolong tunggu sebentar."],["いま しんぶんを よんでいます。","Ima shinbun o yonde imasu.","Sekarang saya sedang membaca koran."],["あさ おきて、シャワーを あびます。","Asa okite, shawā o abimasu.","Pagi bangun lalu mandi shower."]], vocab:[["まって","まって","matte","tunggu (bentuk て)"],["しんぶん","しんぶん","shinbun","koran"],["いま","いま","ima","sekarang"],["おきて","おきて","okite","bangun (bentuk て)"]]},
      {id:"n4-dictionary", title:"Bentuk kamus, た & ない", type:"Grammar", minutes:40, xp:45, intro:"Bentuk dasar membuka jalan ke gaya kasual, kutipan, pengalaman, dan pola lanjutan.", focus:["読む yomu, 読んだ yonda, 読まない yomanai.","〜たことが ある pernah melakukan.","〜ないでください tolong jangan."], pattern:"[Kamus] こと / [た] ことがある / [ない] でください", examples:[["にほんに いったことが あります。","Nihon ni itta koto ga arimasu.","Saya pernah pergi ke Jepang."],["ここで しゃしんを とらないでください。","Koko de shashin o toranaide kudasai.","Tolong jangan mengambil foto di sini."],["およぐことが できます。","Oyogu koto ga dekimasu.","Saya bisa berenang."]], vocab:[["とらないで","とらないで","toranaide","jangan ambil"],["およぐ","およぐ","oyogu","berenang"],["できます","できます","dekimasu","bisa"],["しゃしん","しゃしん","shashin","foto"]]},
      {id:"n4-conditionals", title:"Syarat: たら・ば・と・なら", type:"Grammar", minutes:45, xp:50, intro:"Empat bentuk syarat memiliki nuansa berbeda: urutan, hipotesis, akibat alami, dan topik kondisional.", focus:["たら paling serbaguna untuk “kalau/setelah”.","と untuk akibat yang selalu/otomatis terjadi.","なら mengambil topik dari lawan bicara."], pattern:"[Klausa syarat]、[hasil].", examples:[["あめが ふったら、いえに います。","Ame ga futtara, ie ni imasu.","Kalau hujan turun, saya di rumah."],["この ボタンを おすと、ドアが あきます。","Kono botan o osu to, doa ga akimasu.","Kalau tombol ini ditekan, pintu terbuka."],["にほんへ いくなら、きょうとが おすすめです。","Nihon e iku nara, Kyōto ga osusume desu.","Kalau pergi ke Jepang, Kyoto saya rekomendasikan."]], vocab:[["ふったら","ふったら","futtara","kalau turun (hujan)"],["ボタン","ボタン","botan","tombol"],["おすすめ","おすすめ","osusume","rekomendasi"],["いえ","いえ","ie","rumah"]]},
      {id:"n4-ability", title:"Kemampuan, pengalaman & keinginan", type:"Grammar", minutes:35, xp:40, intro:"Gunakan bentuk potensial, pengalaman lampau, dan keinginan benda secara natural.", focus:["話せる bisa berbicara; 読める bisa membaca.","〜が ほしい menginginkan benda; 〜たい menginginkan tindakan.","〜ほうが いい memberi saran kuat."], pattern:"[Kata kerja potensial] • [benda] が ほしい • [kata kerja-たい]", examples:[["かんじを よむことが できます。","Kanji o yomu koto ga dekimasu.","Saya bisa membaca kanji."],["あたらしい パソコンが ほしいです。","Atarashii pasokon ga hoshii desu.","Saya ingin komputer baru."],["はやく ねたほうが いいです。","Hayaku neta hō ga ii desu.","Sebaiknya tidur lebih awal."]], vocab:[["かんじ","かんじ","kanji","kanji"],["あたらしい","あたらしい","atarashii","baru"],["ほしい","ほしい","hoshii","menginginkan"],["はやく","はやく","hayaku","cepat/lebih awal"]]},
      {id:"n4-giving", title:"Memberi, menerima & rencana", type:"Grammar", minutes:40, xp:45, intro:"Arah pemberian dalam bahasa Jepang penting: あげる memberi ke luar, くれる memberi ke saya/kelompok saya, もらう menerima.", focus:["友達に 本を あげました saya memberi buku ke teman.","友達が 本を くれました teman memberi kepada saya.","〜つもりです rencana; 〜ようと思います sedang mempertimbangkan."], pattern:"[Pemberi] は [penerima] に [benda] を あげる/くれる/もらう", examples:[["ともだちに プレゼントを あげました。","Tomodachi ni purezento o agemashita.","Saya memberi hadiah kepada teman."],["せんせいに ほんを もらいました。","Sensei ni hon o moraimashita.","Saya menerima buku dari guru."],["らいねん にほんへ いく つもりです。","Rainen Nihon e iku tsumori desu.","Tahun depan saya berencana pergi ke Jepang."]], vocab:[["プレゼント","プレゼント","purezento","hadiah"],["つもり","つもり","tsumori","rencana/niat"],["らいねん","らいねん","rainen","tahun depan"],["もらいました","もらいました","moraimashita","menerima (lampau)"]]}
    ]
  }
];

LEVELS.push(
  {
    id:"n3", code:"N3", name:"Menengah", color:"#7c3aed", icon:"三",
    description:"Pasif, kausatif, kalimat kompleks, tuturan tidak langsung, dan keigo dasar.",
    modules:[
      {id:"n3-passive-causative", title:"Pasif & kausatif", type:"Grammar", minutes:50, xp:55, intro:"Pasif [kata kerja]れる/られる menyatakan dikenai tindakan; kausatif [kata kerja]せる/させる menyatakan membuat/menyuruh seseorang melakukan.", focus:["先生に 褒められました dipuji guru.","母は 子供に 野菜を 食べさせました ibu menyuruh anak makan sayur.","Kausatif-pasif 食べさせられる dipaksa makan, umum di bacaan."], pattern:"[Pelaku] に [objek] を [pasif] • [Penyebab] は [orang] に [objek] を [kausatif]", examples:[["せんせいに ほめられました。","Sensei ni homeraremashita.","Saya dipuji oleh guru."],["ははは こどもに やさいを たべさせました。","Haha wa kodomo ni yasai o tabesasemashita.","Ibu menyuruh anak makan sayur."],["あめに ふられて、ずぶぬれでした。","Ame ni furarete, zubunure deshita.","Kehujanan sampai basah kuyup."]], vocab:[["ほめられました","ほめられました","homeraremashita","dipuji"],["やさい","やさい","yasai","sayur"],["こども","こども","kodomo","anak"],["ずぶぬれ","ずぶぬれ","zubunure","basah kuyup"]]},
      {id:"n3-obligation", title:"Kewajiban, larangan & izin lanjutan", type:"Grammar", minutes:40, xp:45, intro:"〜なければならない wajib, 〜てはいけない dilarang, 〜なくてもいい tidak perlu, 〜ざるを得ない terpaksa harus.", focus:["なければ ならない adalah pola wajib paling umum.","なくても いい meniadakan kewajiban, bukan mengizinkan sembarangan dalam konteks formal.","ざるを 得ない bernuansa formal/terpaksa."], pattern:"[ない-bentuk tanpa い] ければならない • [て] はいけない • [なくて] もいい", examples:[["あしたまでに レポートを ださなければなりません。","Ashita made ni repōto o dasanakereba narimasen.","Laporan harus dikumpulkan sebelum besok."],["ここで タバコを すってはいけません。","Koko de tabako o sutte wa ikemasen.","Dilarang merokok di sini."],["きょうは こなくても いいです。","Kyō wa konakute mo ii desu.","Hari ini tidak datang pun tidak apa-apa."]], vocab:[["レポート","レポート","repōto","laporan"],["ださなければ","ださなければ","dasanakereba","jika tidak menyerahkan"],["タバコ","タバコ","tabako","rokok"],["すって","すって","sutte","mengisap (rokok)"]]},
      {id:"n3-complex", title:"Kalimat kompleks: ので・のに・ても", type:"Grammar", minutes:45, xp:50, intro:"ので memberi alasan halus, のに menunjukkan hasil berlawanan dari harapan, ても berarti meskipun/walaupun.", focus:["電車が 遅れたので、遅刻しました karena kereta terlambat.","勉強したのに、落ちました meskipun belajar, tetap gagal — ada rasa kecewa.","雨でも 行きます meskipun hujan, tetap pergi."], pattern:"[Alasan] ので、[hasil] • [fakta] のに、[hasil tak terduga] • [て] も", examples:[["でんしゃが おくれたので、ちこくしました。","Densha ga okureta node, chikoku shimashita.","Karena kereta terlambat, saya terlambat."],["べんきょうしたのに、おちました。","Benkyō shita noni, ochimashita.","Meskipun sudah belajar, saya gagal."],["あめでも いきます。","Ame demo ikimasu.","Meskipun hujan, saya tetap pergi."]], vocab:[["おくれた","おくれた","okureta","terlambat"],["ちこくしました","ちこくしました","chikoku shimashita","terlambat (datang)"],["おちました","おちました","ochimashita","gagal/jatuh"],["あめでも","あめでも","ame demo","meskipun hujan"]]},
      {id:"n3-reported", title:"Tuturan tidak langsung & perkiraan", type:"Grammar", minutes:40, xp:45, intro:"〜そうです (katanya/terlihat), 〜ようです, 〜らしい, dan 〜と思います membantu menyampaikan informasi tanpa menyatakan kepastian mutlak.", focus:["雨が 降りそうです tampak akan hujan (dari tanda visual).","天気予報によると、雨だそうです menurut ramalan, katanya hujan.","彼は 来るようです tampaknya dia datang, berdasarkan bukti."], pattern:"[Klausa] そうです / ようです / らしいです / と思います", examples:[["あめが ふりそうです。","Ame ga furisō desu.","Sepertinya akan hujan."],["てんきよほうによると、あしたは はれだそうです。","Tenki yohō ni yoru to, ashita wa hare da sō desu.","Menurut ramalan cuaca, besok katanya cerah."],["かれは くるようです。","Kare wa kuru yō desu.","Tampaknya dia akan datang."]], vocab:[["ふりそうです","ふりそうです","furisō desu","sepertinya akan turun"],["てんきよほう","てんきよほう","tenki yohō","ramalan cuaca"],["はれ","はれ","hare","cerah"],["ようです","ようです","yō desu","tampaknya"]]},
      {id:"n3-keigo", title:"Keigo dasar & konektor teks", type:"Grammar", minutes:50, xp:55, intro:"Sonkeigo meninggikan lawan bicara, kenjōgo merendahkan diri. Konektor seperti しかし, そのため, また menghubungkan paragraf.", focus:["言う → おっしゃる (sonkeigo) / 申す (kenjōgo).","見る → ご覧になる / 拝見する.","しかし tetapi, そのため oleh karena itu, また selain itu."], pattern:"[Sonkeigo] untuk atasan/tamu • [Kenjōgo] untuk diri sendiri • konektor di awal kalimat", examples:[["しゃちょうは そう おっしゃいました。","Shachō wa sō osshaimashita.","Direktur berkata demikian (sopan tinggi)."],["わたしが ごあんない もうしあげます。","Watashi ga go-annai mōshiagemasu.","Saya yang akan memandu Anda (merendah)."],["しかし、もんだいは のこっています。","Shikashi, mondai wa nokotte imasu.","Namun, masalahnya masih tersisa."]], vocab:[["おっしゃいました","おっしゃいました","osshaimashita","berkata (keigo tinggi)"],["もうしあげます","もうしあげます","mōshiagemasu","mengatakan/memohon (keigo rendah)"],["しゃちょう","しゃちょう","shachō","direktur utama"],["もんだい","もんだい","mondai","masalah"]]}
    ]
  },
  {
    id:"n2", code:"N2", name:"Menengah Atas", color:"#9a3412", icon:"二",
    description:"Bahasa formal, teks berita/akademik, konektor nuansa, dan inferensi penutur.",
    modules:[
      {id:"n2-formal-loc", title:"Pola formal: において・に基づいて・に対して", type:"Grammar", minutes:50, xp:60, intro:"Pola tulis formal: において di/dalam (situasi), に基づいて berdasarkan, に対して terhadap/berlawanan dengan.", focus:["会議において dibahas dalam rapat.","データに基づいて 判断する menilai berdasarkan data.","兄に対して 弟は… berlawanan dengan kakak, adik…"], pattern:"[Kata benda] において / に基づいて / に対して", examples:[["かいぎにおいて、その もんだいが はなされました。","Kaigi ni oite, sono mondai ga hanasaremashita.","Dalam rapat, masalah itu dibahas."],["データに もとづいて はんだんします。","Dēta ni motozuite handan shimasu.","Saya menilai berdasarkan data."],["あにに たいして、おとうとは しずかです。","Ani ni taishite, otōto wa shizuka desu.","Berbeda dengan kakak laki-laki, adik laki-laki pendiam."]], vocab:[["かいぎ","かいぎ","kaigi","rapat"],["データ","データ","dēta","data"],["はんだんします","はんだんします","handan shimasu","menilai"],["たいして","たいして","taishite","terhadap/berlawanan"]]},
      {id:"n2-concession", title:"Konsesi & kontras: にもかかわらず・一方で", type:"Grammar", minutes:45, xp:55, intro:"にもかかわらず meskipun demikian (formal), 一方で di sisi lain, に対して untuk kontras dua hal.", focus:["努力したにもかかわらず、失敗した meskipun berusaha, gagal.","都市が 発展する 一方で、環境問題も 増えた di sisi lain masalah lingkungan bertambah.","Pola ini sangat sering dalam bacaan N2."], pattern:"[Klausa] にもかかわらず、[hasil] • [A] 一方で、[B]", examples:[["どりょくしたにもかかわらず、しっぱいしました。","Doryoku shita ni mo kakawarazu, shippai shimashita.","Meskipun sudah berusaha, saya gagal."],["としが はってんする いっぽうで、もんだいも ふえました。","Toshi ga hatten suru ippō de, mondai mo fuemashita.","Sementara kota berkembang, masalah pun bertambah."],["かれは きびしい。いっぽうで、やさしい ところも ある。","Kare wa kibishii. Ippō de, yasashii tokoro mo aru.","Dia tegas. Di sisi lain, ada sisi lembutnya."]], vocab:[["どりょく","どりょく","doryoku","usaha"],["しっぱいしました","しっぱいしました","shippai shimashita","gagal"],["いっぽうで","いっぽうで","ippō de","di sisi lain"],["きびしい","きびしい","kibishii","tegas/ketat"]]},
      {id:"n2-nominal", title:"Nominalisasi: こと・もの・わけ・はず", type:"Grammar", minutes:50, xp:60, intro:"こと menominalkan fakta, もの memberi nuansa esensi/emosi, わけ kesimpulan logis, はず kepastian berdasarkan alasan.", focus:["来るはずです pasti datang (ada dasar).","来るわけがない tidak mungkin datang.","子供の頃、よく ここで 遊んだものだ dulu sering bermain di sini (nostalgia)."], pattern:"[Klausa] こと / もの / わけ / はず", examples:[["かれは くるはずです。","Kare wa kuru hazu desu.","Dia seharusnya pasti datang."],["そんなことが あるわけが ありません。","Sonna koto ga aru wake ga arimasen.","Tidak mungkin hal seperti itu terjadi."],["こどものころ、よく ここで あそんだものです。","Kodomo no koro, yoku koko de asonda mono desu.","Waktu kecil, saya sering bermain di sini."]], vocab:[["はず","はず","hazu","seharusnya/pasti"],["わけがない","わけがない","wake ga nai","tidak mungkin"],["こどものころ","こどものころ","kodomo no koro","masa kecil"],["あそんだ","あそんだ","asonda","bermain (lampau)"]]},
      {id:"n2-media", title:"Kosakata media & akademik inti", type:"Kosakata", minutes:45, xp:55, intro:"N2 menuntut kata abstrak yang muncul di berita dan esai: lingkungan, tanggung jawab, perbandingan, kebijakan.", focus:["環境 kankyō lingkungan; 国際 kokusai internasional; 比較 hikaku perbandingan.","責任 sekinin tanggung jawab; 許可 kyoka izin; 予定 yotei rencana.","技術 gijutsu teknologi; 発展 hatten perkembangan; 産業 sangyō industri."], pattern:"[Kata abstrak] は/が [predikat formal].", examples:[["かんきょうもんだいは こくさいてきな かだいです。","Kankyō mondai wa kokusaiteki na kadai desu.","Masalah lingkungan adalah isu internasional."],["せきにんを もつことが たいせつです。","Sekinin o motsu koto ga taisetsu desu.","Memiliki tanggung jawab itu penting."],["ぎじゅつの はってんは さんぎょうを かえました。","Gijutsu no hatten wa sangyō o kaemashita.","Perkembangan teknologi mengubah industri."]], vocab:[["かんきょう","かんきょう","kankyō","lingkungan"],["せきにん","せきにん","sekinin","tanggung jawab"],["ぎじゅつ","ぎじゅつ","gijutsu","teknologi/teknik"],["はってん","はってん","hatten","perkembangan"]]},
      {id:"n2-inference", title:"Inferensi & sikap: ざるを得ない・べき・まい", type:"Grammar", minutes:50, xp:60, intro:"Pola sikap penutur tingkat lanjut: ざるを得ない terpaksa harus, べきだ seharusnya (normatif), まい tidak akan/mungkin tidak (klasik).", focus:["行かざるを得ない terpaksa harus pergi.","約束は 守るべきだ janji seharusnya ditepati.","二度と 失敗するまい saya tidak akan gagal lagi (tekad)."], pattern:"[ない-bentuk] ざるを得ない • [kamus] べきだ • [kamus] まい", examples:[["いかざるを えません。","Ikazaru o emasen.","Saya terpaksa harus pergi."],["やくそくは まもるべきです。","Yakusoku wa mamoru beki desu.","Janji seharusnya ditepati."],["にどと しっぱいするまいと おもいます。","Nido to shippai suru mai to omoimasu.","Saya bertekad tidak akan gagal lagi."]], vocab:[["ざるをえない","ざるをえない","zaru o enai","terpaksa harus"],["べき","べき","beki","seharusnya"],["やくそく","やくそく","yakusoku","janji"],["まもる","まもる","mamoru","menepati/melindungi"]]}
    ]
  },
  {
    id:"n1", code:"N1", name:"Mahir", color:"#111827", icon:"一",
    description:"Tata bahasa sastra dan formal tingkat tinggi, idiom abstrak, keigo lanjutan, dan retorika bacaan panjang.",
    modules:[
      {id:"n1-literary", title:"Pola sastra: といえども・にしても・であれ", type:"Grammar", minutes:55, xp:70, intro:"Pola tulis mahir: といえども meskipun dikatakan…, にしても kalaupun…, であれ siapapun/apapun… tetap.", focus:["専門家といえども、間違うことがある meskipun ahli, bisa salah.","誰であれ、規則は守るべきだ siapapun orangnya, aturan harus dipatuhi.","文体 cenderung sastra dan editorial."], pattern:"[X] といえども • [X] にしても • [X] であれ", examples:[["せんもんかといえども、まちがうことが あります。","Senmonka to iedomo, machigau koto ga arimasu.","Meskipun seorang ahli, bisa saja berbuat salah."],["だれであれ、きそくは まもるべきです。","Dare de are, kisoku wa mamoru beki desu.","Siapa pun orangnya, peraturan harus dipatuhi."],["いそがしいにしても、れんらくは すべきです。","Isogashii ni shite mo, renraku wa su beki desu.","Kalaupun sibuk, seharusnya tetap memberi kabar."]], vocab:[["せんもんか","せんもんか","senmonka","ahli/spesialis"],["まちがう","まちがう","machigau","berbuat salah"],["きそく","きそく","kisoku","peraturan"],["れんらく","れんらく","renraku","kontak/kabar"]]},
      {id:"n1-abstract", title:"Kosakata abstrak & idiom mahir", type:"Kosakata", minutes:55, xp:70, intro:"N1 dipenuhi kata abstrak Sino-Jepang dan idiom: 曖昧 kabur, 概念 konsep, 犠牲 pengorbanan, 抵抗 perlawanan.", focus:["曖昧な 返事 jawaban yang mengambang.","大きな 犠牲を 払う membayar pengorbanan besar.","社会の 変化に 抵抗する menolak perubahan sosial."], pattern:"[Kata benda abstrak] は/を [kata kerja formal].", examples:[["かれの へんじは あいまいでした。","Kare no henji wa aimai deshita.","Jawabannya kabur/mengambang."],["おおきな ぎせいを はらいました。","Ōkina gisei o haraimashita.","Saya membayar pengorbanan yang besar."],["へんかに ていこうする ひとが います。","Henka ni teikō suru hito ga imasu.","Ada orang yang menentang perubahan."]], vocab:[["あいまい","あいまい","aimai","kabur/ambigu"],["ぎせい","ぎせい","gisei","pengorbanan"],["ていこう","ていこう","teikō","perlawanan"],["がいねん","がいねん","gainen","konsep"]]},
      {id:"n1-argument", title:"Konektor argumentatif tingkat lanjut", type:"Grammar", minutes:50, xp:65, intro:"Editorial memakai それどころか justru sebaliknya, むしろ malah, なおさらに terlebih lagi, 要するに singkatnya.", focus:["安くなるどころか、値上がりした justru naik harga, bukan turun.","むしろ menegaskan pilihan yang berlawanan dari dugaan.","要するに merangkum inti argumen di akhir."], pattern:"[Klaim] それどころか、[kebalikan] • むしろ [pilihan] • 要するに [inti]", examples:[["やすくなるどころか、ねあがりしました。","Yasuku naru dokoro ka, neagari shimashita.","Bukannya lebih murah, justru harganya naik."],["むしろ、このほうが あんぜんです。","Mushiro, kono hō ga anzen desu.","Malah, cara ini lebih aman."],["ようするに、じかんが たりません。","Yō suru ni, jikan ga tarimasen.","Singkatnya, waktunya tidak cukup."]], vocab:[["それどころか","それどころか","sore dokoro ka","justru sebaliknya"],["むしろ","むしろ","mushiro","malah/lebih tepatnya"],["ねあがり","ねあがり","neagari","kenaikan harga"],["ようするに","ようするに","yō suru ni","singkatnya"]]},
      {id:"n1-keigo-adv", title:"Keigo lanjutan & tulisan resmi", type:"Grammar", minutes:55, xp:70, intro:"Bahasa resmi memakai pasif sebagai penghormatan, bentuk させていただく, dan frasa surat seperti 恐れ入りますが.", focus:["社長は もう お帰りになりました direktur sudah pulang (sopan).","説明させていただきます izinkan saya menjelaskan (sangat sopan).","恐れ入りますが、… frasa pembuka permintaan dalam surat resmi."], pattern:"お/ご [kata kerja] になる (sonkeigo) • [kausatif] ていただく (kenjōgo sopan)", examples:[["しゃちょうは もう おかえりに なりました。","Shachō wa mō okaeri ni narimashita.","Bapak/Ibu Direktur sudah berkenan pulang."],["ごせつめい させていただきます。","Go-setsumei sasete itadakimasu.","Perkenankan saya menjelaskannya."],["おそれいりますが、ごかくにんください。","Osoreirimasu ga, go-kakunin kudasai.","Mohon maaf sebelumnya, mohon periksa kembali."]], vocab:[["おかえりに なりました","おかえりに なりました","okaeri ni narimashita","sudah pulang (keigo)"],["させていただきます","させていただきます","sasete itadakimasu","perkenankan saya melakukan"],["おそれいります","おそれいります","osoreirimasu","mohon maaf sebelumnya"],["ごかくにん","ごかくにん","go-kakunin","pemeriksaan (sopan)"]]},
      {id:"n1-rhetoric", title:"Retorika & bacaan panjang", type:"Membaca", minutes:60, xp:75, intro:"Teks N1 memakai kalimat panjang berlapis, penghilangan subjek, dan referensi anaforis. Strategi: cari predikat akhir, tandai konektor, abaikan sisipan.", focus:["Predikat utama biasanya di akhir kalimat panjang.","〜にほかならない tidak lain adalah…; penegasan kesimpulan.","Parafrase adalah keterampilan inti ujian membaca N1."], pattern:"[Premis panjang] にほかならない — tidak lain adalah [kesimpulan].", examples:[["せいこうの ひけつは けいぞくに ほかならない。","Seikō no hiketsu wa keizoku ni hokanaranai.","Rahasia keberhasilan tidak lain adalah konsistensi."],["もんだいは たんに おかねでは ない。","Mondai wa tan ni okane de wa nai.","Masalahnya bukan sekadar uang."],["かれの はつげんは ちゅうもくに あたいする。","Kare no hatsugen wa chūmoku ni atai suru.","Pernyataannya layak mendapat perhatian."]], vocab:[["にほかならない","にほかならない","ni hokanaranai","tidak lain adalah"],["けいぞく","けいぞく","keizoku","konsistensi/kelanjutan"],["はつげん","はつげん","hatsugen","pernyataan/ucapan"],["あたいする","あたいする","atai suru","layak/bernilai"]]}
    ]
  }
);

/* ===== KANJI BANK (inti terkurasi per level) ===== */
const KANJI = [
  // N5
  {char:"日",level:"n5",onyomi:"ニチ・ジツ",kunyomi:"ひ・か",meaning:"hari / matahari",example:"日本（にほん）— Jepang"},
  {char:"月",level:"n5",onyomi:"ゲツ・ガツ",kunyomi:"つき",meaning:"bulan",example:"月曜日（げつようび）— Senin"},
  {char:"年",level:"n5",onyomi:"ネン",kunyomi:"とし",meaning:"tahun",example:"来年（らいねん）— tahun depan"},
  {char:"時",level:"n5",onyomi:"ジ",kunyomi:"とき",meaning:"waktu / jam",example:"時間（じかん）— waktu"},
  {char:"人",level:"n5",onyomi:"ジン・ニン",kunyomi:"ひと",meaning:"orang",example:"日本人（にほんじん）— orang Jepang"},
  {char:"本",level:"n5",onyomi:"ホン",kunyomi:"もと",meaning:"buku / asal",example:"本（ほん）— buku"},
  {char:"語",level:"n5",onyomi:"ゴ",kunyomi:"かた(る)",meaning:"bahasa / kata",example:"日本語（にほんご）— bahasa Jepang"},
  {char:"先",level:"n5",onyomi:"セン",kunyomi:"さき",meaning:"sebelum / duluan",example:"先生（せんせい）— guru"},
  {char:"生",level:"n5",onyomi:"セイ・ショウ",kunyomi:"い(きる)・う(まれる)",meaning:"hidup / lahir",example:"学生（がくせい）— pelajar"},
  {char:"学",level:"n5",onyomi:"ガク",kunyomi:"まな(ぶ)",meaning:"belajar",example:"学校（がっこう）— sekolah"},
  {char:"山",level:"n5",onyomi:"サン",kunyomi:"やま",meaning:"gunung",example:"富士山（ふじさん）— Gunung Fuji"},
  {char:"川",level:"n5",onyomi:"セン",kunyomi:"かわ",meaning:"sungai",example:"川（かわ）— sungai"},
  // N4
  {char:"会",level:"n4",onyomi:"カイ",kunyomi:"あ(う)",meaning:"bertemu / perkumpulan",example:"会社（かいしゃ）— perusahaan"},
  {char:"社",level:"n4",onyomi:"シャ",kunyomi:"やしろ",meaning:"perusahaan / kuil",example:"会社（かいしゃ）— perusahaan"},
  {char:"店",level:"n4",onyomi:"テン",kunyomi:"みせ",meaning:"toko",example:"店（みせ）— toko"},
  {char:"駅",level:"n4",onyomi:"エキ",kunyomi:"—",meaning:"stasiun",example:"駅（えき）— stasiun"},
  {char:"病",level:"n4",onyomi:"ビョウ",kunyomi:"やまい",meaning:"sakit / penyakit",example:"病院（びょういん）— rumah sakit"},
  {char:"院",level:"n4",onyomi:"イン",kunyomi:"—",meaning:"institusi / gedung",example:"病院（びょういん）— rumah sakit"},
  {char:"家",level:"n4",onyomi:"カ・ケ",kunyomi:"いえ・うち",meaning:"rumah / keluarga",example:"家族（かぞく）— keluarga"},
  {char:"族",level:"n4",onyomi:"ゾク",kunyomi:"—",meaning:"keluarga / suku",example:"家族（かぞく）— keluarga"},
  {char:"仕",level:"n4",onyomi:"シ・ジ",kunyomi:"つか(える)",meaning:"melayani / bekerja",example:"仕事（しごと）— pekerjaan"},
  {char:"勉",level:"n4",onyomi:"ベン",kunyomi:"つと(める)",meaning:"berusaha / belajar",example:"勉強（べんきょう）— belajar"},
  {char:"強",level:"n4",onyomi:"キョウ・ゴウ",kunyomi:"つよ(い)",meaning:"kuat",example:"勉強（べんきょう）— belajar"},
  {char:"漢",level:"n4",onyomi:"カン",kunyomi:"—",meaning:"Han / Tiongkok",example:"漢字（かんじ）— kanji"},
  // N3
  {char:"政",level:"n3",onyomi:"セイ",kunyomi:"まつりごと",meaning:"politik / pemerintahan",example:"政治（せいじ）— politik"},
  {char:"治",level:"n3",onyomi:"ジ・チ",kunyomi:"おさ(める)・なお(る)",meaning:"memerintah / sembuh",example:"政治（せいじ）— politik"},
  {char:"経",level:"n3",onyomi:"ケイ・キョウ",kunyomi:"へ(る)",meaning:"melewati / sutra",example:"経済（けいざい）— ekonomi"},
  {char:"済",level:"n3",onyomi:"サイ・セイ",kunyomi:"す(む)",meaning:"selesai / menolong",example:"経済（けいざい）— ekonomi"},
  {char:"情",level:"n3",onyomi:"ジョウ・セイ",kunyomi:"なさ(け)",meaning:"perasaan / informasi",example:"情報（じょうほう）— informasi"},
  {char:"報",level:"n3",onyomi:"ホウ",kunyomi:"むく(いる)",meaning:"laporan / berita",example:"情報（じょうほう）— informasi"},
  {char:"運",level:"n3",onyomi:"ウン",kunyomi:"はこ(ぶ)",meaning:"membawa / nasib",example:"運転（うんてん）— mengemudi"},
  {char:"練",level:"n3",onyomi:"レン",kunyomi:"ね(る)",meaning:"berlatih / mengasah",example:"練習（れんしゅう）— latihan"},
  {char:"質",level:"n3",onyomi:"シツ・シチ",kunyomi:"たち",meaning:"kualitas / sifat",example:"質問（しつもん）— pertanyaan"},
  {char:"決",level:"n3",onyomi:"ケツ",kunyomi:"き(める)",meaning:"memutuskan",example:"決心（けっしん）— tekad"},
  {char:"意",level:"n3",onyomi:"イ",kunyomi:"—",meaning:"maksud / pikiran",example:"意味（いみ）— arti"},
  {char:"関",level:"n3",onyomi:"カン",kunyomi:"せき・かか(わる)",meaning:"berkaitan / gerbang",example:"関係（かんけい）— hubungan"},
  // N2
  {char:"環",level:"n2",onyomi:"カン",kunyomi:"わ",meaning:"lingkaran / lingkungan",example:"環境（かんきょう）— lingkungan"},
  {char:"境",level:"n2",onyomi:"キョウ・ケイ",kunyomi:"さかい",meaning:"batas / wilayah",example:"環境（かんきょう）— lingkungan"},
  {char:"際",level:"n2",onyomi:"サイ",kunyomi:"きわ",meaning:"kesempatan / tepi",example:"国際（こくさい）— internasional"},
  {char:"比",level:"n2",onyomi:"ヒ",kunyomi:"くら(べる)",meaning:"membandingkan",example:"比較（ひかく）— perbandingan"},
  {char:"較",level:"n2",onyomi:"カク・コウ",kunyomi:"くら(べる)",meaning:"membandingkan",example:"比較（ひかく）— perbandingan"},
  {char:"責",level:"n2",onyomi:"セキ",kunyomi:"せ(める)",meaning:"menyalahkan / tanggung",example:"責任（せきにん）— tanggung jawab"},
  {char:"任",level:"n2",onyomi:"ニン",kunyomi:"まか(せる)",meaning:"mempercayakan",example:"責任（せきにん）— tanggung jawab"},
  {char:"許",level:"n2",onyomi:"キョ",kunyomi:"ゆる(す)",meaning:"mengizinkan",example:"許可（きょか）— izin"},
  {char:"予",level:"n2",onyomi:"ヨ・シャ",kunyomi:"あらかじ(め)",meaning:"sebelumnya",example:"予定（よてい）— rencana/jadwal"},
  {char:"検",level:"n2",onyomi:"ケン",kunyomi:"しら(べる)",meaning:"memeriksa",example:"検査（けんさ）— pemeriksaan"},
  {char:"技",level:"n2",onyomi:"ギ",kunyomi:"わざ",meaning:"teknik / keterampilan",example:"技術（ぎじゅつ）— teknologi"},
  {char:"術",level:"n2",onyomi:"ジュツ",kunyomi:"すべ",meaning:"seni / teknik",example:"技術（ぎじゅつ）— teknologi"},
  // N1
  {char:"概",level:"n1",onyomi:"ガイ",kunyomi:"おおむ(ね)",meaning:"garis besar / umumnya",example:"概念（がいねん）— konsep"},
  {char:"念",level:"n1",onyomi:"ネン",kunyomi:"—",meaning:"pikiran / gagasan",example:"概念（がいねん）— konsep"},
  {char:"慮",level:"n1",onyomi:"リョ",kunyomi:"おもんぱか(る)",meaning:"mempertimbangkan",example:"配慮（はいりょ）— kepedulian/pertimbangan"},
  {char:"曖",level:"n1",onyomi:"アイ",kunyomi:"あい(まい)",meaning:"samar / kabur",example:"曖昧（あいまい）— ambigu"},
  {char:"昧",level:"n1",onyomi:"マイ・バイ",kunyomi:"あい(まい)",meaning:"gelap / samar",example:"曖昧（あいまい）— ambigu"},
  {char:"顕",level:"n1",onyomi:"ケン",kunyomi:"あきら(か)",meaning:"tampak jelas",example:"顕著（けんちょ）— mencolok/nyata"},
  {char:"著",level:"n1",onyomi:"チョ・チャク",kunyomi:"あらわ(す)・いちじる(しい)",meaning:"menulis / menonjol",example:"著名（ちょめい）— terkenal"},
  {char:"犠",level:"n1",onyomi:"ギ",kunyomi:"いけにえ",meaning:"korban persembahan",example:"犠牲（ぎせい）— pengorbanan"},
  {char:"牲",level:"n1",onyomi:"セイ",kunyomi:"—",meaning:"hewan korban",example:"犠牲（ぎせい）— pengorbanan"},
  {char:"抵",level:"n1",onyomi:"テイ",kunyomi:"—",meaning:"menahan / menentang",example:"抵抗（ていこう）— perlawanan"},
  {char:"抗",level:"n1",onyomi:"コウ",kunyomi:"あらが(う)",meaning:"melawan",example:"抵抗（ていこう）— perlawanan"},
  {char:"抑",level:"n1",onyomi:"ヨク",kunyomi:"おさ(える)",meaning:"menekan / menahan",example:"抑圧（よくあつ）— penindasan"},
  {char:"圧",level:"n1",onyomi:"アツ・エン・オウ",kunyomi:"お(す)・へ(す)",meaning:"tekanan",example:"圧力（あつりょく）— tekanan"},
  {char:"促",level:"n1",onyomi:"ソク",kunyomi:"うなが(す)",meaning:"mendorong / mendesak",example:"促進（そくしん）— promosi/percepatan"},
  {char:"催",level:"n1",onyomi:"サイ",kunyomi:"もよお(す)",meaning:"menyelenggarakan",example:"開催（かいさい）— penyelenggaraan"}
];

/* ===== GRAMMAR INDEX (untuk pencarian & kuis) ===== */
const GRAMMAR_INDEX = [
  {level:"n5", pattern:"〜は〜です", meaning:"Pola topik: [X] adalah [Y].", example:"わたしは 学生です。— Saya seorang pelajar."},
  {level:"n5", pattern:"〜が すきです", meaning:"Menyukai sesuatu (objek ditandai が).", example:"すしが すきです。— Saya suka sushi."},
  {level:"n5", pattern:"〜を", meaning:"Partikel objek langsung.", example:"本を 読みます。— Membaca buku."},
  {level:"n5", pattern:"〜に / へ", meaning:"Tujuan, arah, atau waktu spesifik.", example:"学校に 行きます。— Pergi ke sekolah."},
  {level:"n5", pattern:"〜より〜のほうが", meaning:"Perbandingan: [B] lebih … daripada [A].", example:"コーヒーより おちゃのほうが すきです。— Saya lebih suka teh daripada kopi."},
  {level:"n5", pattern:"〜で", meaning:"Tempat aktivitas atau alat/cara.", example:"電車で 行きます。— Pergi dengan kereta."},
  {level:"n4", pattern:"〜てください", meaning:"Tolong lakukan / silakan lakukan.", example:"待ってください。— Tolong tunggu."},
  {level:"n4", pattern:"〜たり〜たり", meaning:"Melakukan ini-itu (contoh kegiatan tak berurutan).", example:"よんだり かいたり します。— Membaca, menulis, dan semacamnya."},
  {level:"n4", pattern:"〜たことがある", meaning:"Pernah melakukan sesuatu.", example:"日本に 行ったことがある。— Pernah pergi ke Jepang."},
  {level:"n4", pattern:"〜たら", meaning:"Kalau / setelah (syarat serbaguna).", example:"雨が降ったら、います。— Kalau hujan, saya di rumah."},
  {level:"n4", pattern:"〜てあげる/くれる/もらう", meaning:"Melakukan sesuatu untuk / dari seseorang.", example:"おしえてもらいました。— Saya dibantu diajari."},
  {level:"n4", pattern:"〜つもりです", meaning:"Berencana / bermaksud melakukan.", example:"来年 行く つもりです。— Tahun depan saya berencana pergi."},
  {level:"n3", pattern:"〜ざるをえない-pendek", meaning:"Bentuk lisan: なきゃ / なくちゃ (harus).", example:"もう いかなきゃ。— Saya sudah harus pergi."},
  {level:"n3", pattern:"〜なければならない", meaning:"Harus / wajib melakukan.", example:"出さなければなりません。— Harus dikumpulkan."},
  {level:"n3", pattern:"〜ように なります", meaning:"Berubah menjadi bisa/terbiasa melakukan.", example:"およげるように なりました。— Saya jadi bisa berenang."},
  {level:"n3", pattern:"〜のに", meaning:"Meskipun (hasil berlawanan dari harapan).", example:"勉強したのに、落ちました。— Meskipun belajar, gagal."},
  {level:"n3", pattern:"〜そうです", meaning:"Katanya / sepertinya (tanda visual).", example:"雨が降りそうです。— Sepertinya akan hujan."},
  {level:"n3", pattern:"おっしゃる", meaning:"Keigo tinggi untuk 言う (berkata).", example:"社長はそうおっしゃいました。— Direktur berkata demikian."},
  {level:"n2", pattern:"〜によって", meaning:"Oleh / dengan cara / bergantung pada / karena.", example:"ひとによって かんがえが ちがいます。— Tergantung orangnya, pemikirannya berbeda."},
  {level:"n2", pattern:"〜において", meaning:"Di / dalam (konteks formal).", example:"会議において話します。— Membahas dalam rapat."},
  {level:"n2", pattern:"〜にもかかわらず", meaning:"Meskipun demikian (formal).", example:"努力したにもかかわらず、失敗した。— Meski berusaha, gagal."},
  {level:"n2", pattern:"〜わけでは ない", meaning:"Bukan berarti … (menyangkal kesimpulan penuh).", example:"きらいな わけでは ありません。— Bukan berarti saya benci."},
  {level:"n2", pattern:"〜はずです", meaning:"Seharusnya pasti (berdasarkan alasan).", example:"彼は来るはずです。— Dia seharusnya pasti datang."},
  {level:"n2", pattern:"〜ざるを得ない", meaning:"Terpaksa harus melakukan.", example:"行かざるを得ません。— Terpaksa harus pergi."},
  {level:"n1", pattern:"〜いかんにかかわらず", meaning:"Tanpa memandang … (formal).", example:"りゆうの いかんに かかわらず、きんしです。— Apa pun alasannya, dilarang."},
  {level:"n1", pattern:"〜といえども", meaning:"Meskipun dikatakan… (sastra/formal).", example:"専門家といえども、間違う。— Meski ahli, bisa salah."},
  {level:"n1", pattern:"〜んばかり", meaning:"Sikap seolah-olah hampir … (tinggal sedikit lagi).", example:"とびつかんばかりの えがおでした。— Senyumnya seolah hendak menerkam (saking girangnya)."},
  {level:"n1", pattern:"それどころか", meaning:"Justru sebaliknya, bukan… malah…", example:"安くなるどころか、値上がりした。— Bukannya murah, justru naik."},
  {level:"n1", pattern:"〜はもとより", meaning:"Jangankan … , apalagi … .", example:"にほんじんは もとより、がいこくじんにも しられています。— Jangankan orang Jepang, orang asing pun tahu."},
  {level:"n1", pattern:"〜にほかならない", meaning:"Tidak lain adalah… (kesimpulan tegas).", example:"秘訣は継続にほかならない。— Rahasianya tidak lain adalah konsistensi."},
  {level:"n1", pattern:"〜させていただく", meaning:"Perkenankan saya melakukan (kenjōgo sangat sopan).", example:"説明させていただきます。— Perkenankan saya menjelaskan."}
];
