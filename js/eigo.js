// えいご：アルファベットと英単語・問題を作るしくみ（SPEC.md 15章）
(function (root) {
  'use strict';

  var MAX_LEVEL = 10;
  var CORRECT_PER_LEVEL = 8;
  var QUESTIONS_PER_SET = 4;
  var MAX_MISTAKES = 20;

  // アルファベット（レベル1〜3）
  // say: 読み上げに使う文字列（1文字だけだと「ア」のように読まれることがあるので、文字の名前で書く）
  // kana: カタカナの読みがな
  var LETTER_LEVELS = [
    [
      { id: 'A', say: 'ay', kana: 'エー' }, { id: 'B', say: 'bee', kana: 'ビー' }, { id: 'C', say: 'see', kana: 'シー' },
      { id: 'D', say: 'dee', kana: 'ディー' }, { id: 'E', say: 'ee', kana: 'イー' }, { id: 'F', say: 'eff', kana: 'エフ' },
      { id: 'G', say: 'gee', kana: 'ジー' }, { id: 'H', say: 'aitch', kana: 'エイチ' }, { id: 'I', say: 'eye', kana: 'アイ' }
    ],
    [
      { id: 'J', say: 'jay', kana: 'ジェー' }, { id: 'K', say: 'kay', kana: 'ケー' }, { id: 'L', say: 'el', kana: 'エル' },
      { id: 'M', say: 'em', kana: 'エム' }, { id: 'N', say: 'en', kana: 'エヌ' }, { id: 'O', say: 'oh', kana: 'オー' },
      { id: 'P', say: 'pee', kana: 'ピー' }, { id: 'Q', say: 'cue', kana: 'キュー' }, { id: 'R', say: 'are', kana: 'アール' }
    ],
    [
      { id: 'S', say: 'ess', kana: 'エス' }, { id: 'T', say: 'tee', kana: 'ティー' }, { id: 'U', say: 'you', kana: 'ユー' },
      { id: 'V', say: 'vee', kana: 'ブイ' }, { id: 'W', say: 'double you', kana: 'ダブリュー' }, { id: 'X', say: 'ex', kana: 'エックス' },
      { id: 'Y', say: 'why', kana: 'ワイ' }, { id: 'Z', say: 'zee', kana: 'ズィー' }
    ]
  ];

  // 英単語（レベル4〜10）
  // ja: 日本語の意味 / kana: カタカナの読みがな
  var WORD_LEVELS = [
    { theme: 'たべもの', words: [
      { id: 'apple', ja: 'りんご', kana: 'アップル' }, { id: 'banana', ja: 'バナナ', kana: 'バナナ' },
      { id: 'grapes', ja: 'ぶどう', kana: 'グレイプス' }, { id: 'strawberry', ja: 'いちご', kana: 'ストロベリー' },
      { id: 'cake', ja: 'ケーキ', kana: 'ケイク' }, { id: 'egg', ja: 'たまご', kana: 'エッグ' },
      { id: 'milk', ja: 'ぎゅうにゅう', kana: 'ミルク' }, { id: 'bread', ja: 'パン', kana: 'ブレッド' }
    ] },
    { theme: 'どうぶつ', words: [
      { id: 'dog', ja: 'いぬ', kana: 'ドッグ' }, { id: 'cat', ja: 'ねこ', kana: 'キャット' },
      { id: 'rabbit', ja: 'うさぎ', kana: 'ラビット' }, { id: 'bird', ja: 'とり', kana: 'バード' },
      { id: 'fish', ja: 'さかな', kana: 'フィッシュ' }, { id: 'bear', ja: 'くま', kana: 'ベア' },
      { id: 'pig', ja: 'ぶた', kana: 'ピッグ' }, { id: 'frog', ja: 'かえる', kana: 'フロッグ' }
    ] },
    { theme: 'いろ', words: [
      { id: 'red', ja: 'あか', kana: 'レッド' }, { id: 'blue', ja: 'あお', kana: 'ブルー' },
      { id: 'yellow', ja: 'きいろ', kana: 'イエロー' }, { id: 'green', ja: 'みどり', kana: 'グリーン' },
      { id: 'pink', ja: 'ピンク', kana: 'ピンク' }, { id: 'white', ja: 'しろ', kana: 'ホワイト' },
      { id: 'black', ja: 'くろ', kana: 'ブラック' }, { id: 'orange', ja: 'オレンジいろ', kana: 'オレンジ' }
    ] },
    { theme: 'かず', words: [
      { id: 'one', ja: '1（いち）', kana: 'ワン' }, { id: 'two', ja: '2（に）', kana: 'トゥー' },
      { id: 'three', ja: '3（さん）', kana: 'スリー' }, { id: 'four', ja: '4（よん）', kana: 'フォー' },
      { id: 'five', ja: '5（ご）', kana: 'ファイブ' }, { id: 'six', ja: '6（ろく）', kana: 'シックス' },
      { id: 'seven', ja: '7（なな）', kana: 'セブン' }, { id: 'eight', ja: '8（はち）', kana: 'エイト' }
    ] },
    { theme: 'からだ', words: [
      { id: 'eye', ja: 'め', kana: 'アイ' }, { id: 'ear', ja: 'みみ', kana: 'イヤー' },
      { id: 'nose', ja: 'はな', kana: 'ノーズ' }, { id: 'mouth', ja: 'くち', kana: 'マウス' },
      { id: 'hand', ja: 'て', kana: 'ハンド' }, { id: 'foot', ja: 'あし', kana: 'フット' },
      { id: 'hair', ja: 'かみのけ', kana: 'ヘアー' }, { id: 'tooth', ja: 'は', kana: 'トゥース' }
    ] },
    { theme: 'のりもの・もの', words: [
      { id: 'car', ja: 'くるま', kana: 'カー' }, { id: 'bus', ja: 'バス', kana: 'バス' },
      { id: 'train', ja: 'でんしゃ', kana: 'トレイン' }, { id: 'boat', ja: 'ふね', kana: 'ボート' },
      { id: 'airplane', ja: 'ひこうき', kana: 'エアプレイン' }, { id: 'bicycle', ja: 'じてんしゃ', kana: 'バイシクル' },
      { id: 'ball', ja: 'ボール', kana: 'ボール' }, { id: 'book', ja: 'ほん', kana: 'ブック' }
    ] },
    { theme: 'しぜん', words: [
      { id: 'sun', ja: 'たいよう', kana: 'サン' }, { id: 'moon', ja: 'つき', kana: 'ムーン' },
      { id: 'star', ja: 'ほし', kana: 'スター' }, { id: 'cloud', ja: 'くも', kana: 'クラウド' },
      { id: 'rain', ja: 'あめ', kana: 'レイン' }, { id: 'tree', ja: 'き', kana: 'ツリー' },
      { id: 'flower', ja: 'はな', kana: 'フラワー' }, { id: 'rainbow', ja: 'にじ', kana: 'レインボー' }
    ] }
  ];

  // アルファベットの書き順（109×109 の枠。配列の順番が書き順）
  var LETTER_STROKES = {
    A: ['M54.5 15 L24 94', 'M54.5 15 L85 94', 'M35 66 L74 66'],
    B: ['M30 15 L30 94', 'M30 15 L60 15 C80 15 80 52 60 52 L30 52', 'M30 52 L64 52 C86 52 86 94 64 94 L30 94'],
    C: ['M82 30 C72 12 40 10 28 32 C18 50 22 78 40 90 C56 99 76 92 84 78'],
    D: ['M30 15 L30 94', 'M30 15 L52 15 C92 15 92 94 52 94 L30 94'],
    E: ['M32 15 L32 94', 'M32 15 L80 15', 'M32 54 L74 54', 'M32 94 L80 94'],
    F: ['M32 15 L32 94', 'M32 15 L80 15', 'M32 54 L74 54'],
    G: ['M82 30 C72 12 40 10 28 32 C18 50 22 78 40 90 C56 99 78 92 84 74 L84 56', 'M62 56 L84 56'],
    H: ['M28 15 L28 94', 'M81 15 L81 94', 'M28 54 L81 54'],
    I: ['M54.5 15 L54.5 94'],
    J: ['M72 15 L72 72 C72 96 36 98 30 76'],
    K: ['M30 15 L30 94', 'M80 15 L30 62', 'M46 48 L82 94'],
    L: ['M32 15 L32 94 L80 94'],
    M: ['M22 15 L22 94', 'M22 15 L54.5 80 L87 15', 'M87 15 L87 94'],
    N: ['M26 15 L26 94', 'M26 15 L83 94', 'M83 15 L83 94'],
    O: ['M54.5 15 C28 15 20 40 20 54.5 C20 72 32 94 54.5 94 C78 94 89 72 89 54.5 C89 36 78 15 54.5 15'],
    P: ['M30 15 L30 94', 'M30 15 L60 15 C84 15 84 56 60 56 L30 56'],
    Q: ['M54.5 15 C28 15 20 40 20 54.5 C20 72 32 94 54.5 94 C78 94 89 72 89 54.5 C89 36 78 15 54.5 15', 'M60 72 L88 98'],
    R: ['M30 15 L30 94', 'M30 15 L60 15 C84 15 84 54 60 54 L30 54', 'M52 54 L82 94'],
    S: ['M80 26 C70 12 36 12 30 30 C24 48 48 52 58 55 C76 60 86 72 78 86 C68 100 34 98 26 82'],
    T: ['M20 15 L89 15', 'M54.5 15 L54.5 94'],
    U: ['M26 15 L26 66 C26 100 83 100 83 66 L83 15'],
    V: ['M22 15 L54.5 94 L87 15'],
    W: ['M14 15 L32 94 L54.5 34 L77 94 L95 15'],
    X: ['M24 15 L85 94', 'M85 15 L24 94'],
    Y: ['M22 15 L54.5 55', 'M87 15 L54.5 55', 'M54.5 55 L54.5 94'],
    Z: ['M24 15 L85 15 L24 94 L85 94']
  };

  // すべての問題を1つの一覧にする
  var ALL = [];
  var LEVELS = [];
  LETTER_LEVELS.forEach(function (list, i) {
    LEVELS.push(list.map(function (l) {
      var q = { id: l.id, type: 'letter', level: i + 1, say: l.say, kana: l.kana, ja: '' };
      ALL.push(q);
      return q;
    }));
  });
  WORD_LEVELS.forEach(function (group, i) {
    LEVELS.push(group.words.map(function (w) {
      var q = { id: w.id, type: 'word', level: LETTER_LEVELS.length + i + 1, say: w.id, kana: w.kana, ja: w.ja, theme: group.theme };
      ALL.push(q);
      return q;
    }));
  });

  function get(id) {
    for (var i = 0; i < ALL.length; i++) {
      if (ALL[i].id === id) return ALL[i];
    }
    return null;
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function clampLevel(level) {
    return Math.min(MAX_LEVEL, Math.max(1, Math.floor(level) || 1));
  }

  function levelFromCorrect(totalCorrect) {
    return clampLevel(Math.floor(totalCorrect / CORRECT_PER_LEVEL) + 1);
  }

  function correctToNextLevel(totalCorrect) {
    if (levelFromCorrect(totalCorrect) >= MAX_LEVEL) return 0;
    return CORRECT_PER_LEVEL - (totalCorrect % CORRECT_PER_LEVEL);
  }

  // 1回のあそび（4問）を作る。1問は「間違えた問題」か「前のレベルの問題」にする
  function buildSet(level, mistakes) {
    level = clampLevel(level);
    var review = null;
    var missed = (mistakes || []).map(function (m) { return get(m.id); })
      .filter(function (q) { return q && q.level <= level; });
    if (missed.length > 0) {
      review = missed[randInt(0, missed.length - 1)];
    } else if (level > 1) {
      var older = ALL.filter(function (q) { return q.level < level; });
      review = older[randInt(0, older.length - 1)];
    }

    var set = [];
    if (review) set.push({ id: review.id, review: true });
    shuffle(LEVELS[level - 1]).forEach(function (q) {
      if (set.length < QUESTIONS_PER_SET && (!review || q.id !== review.id)) {
        set.push({ id: q.id, review: false });
      }
    });
    return shuffle(set);
  }

  // 選択肢（正解1つ＋同じレベルからまちがい2つ）
  function choicesFor(id) {
    var q = get(id);
    var others = shuffle(LEVELS[q.level - 1].filter(function (o) { return o.id !== id; })).slice(0, 2);
    return shuffle([q.id].concat(others.map(function (o) { return o.id; })));
  }

  function recordMistake(mistakes, id, nowIso) {
    var list = (mistakes || []).slice();
    var existing = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        existing = list.splice(i, 1)[0];
        break;
      }
    }
    list.unshift({ id: id, missCount: existing ? existing.missCount + 1 : 1, lastMissedAt: nowIso });
    return list.slice(0, MAX_MISTAKES);
  }

  function removeMistake(mistakes, id) {
    return (mistakes || []).filter(function (m) { return m.id !== id; });
  }

  var api = {
    MAX_LEVEL: MAX_LEVEL,
    CORRECT_PER_LEVEL: CORRECT_PER_LEVEL,
    QUESTIONS_PER_SET: QUESTIONS_PER_SET,
    MAX_MISTAKES: MAX_MISTAKES,
    LEVELS: LEVELS,
    ALL: ALL,
    LETTER_STROKES: LETTER_STROKES,
    get: get,
    levelFromCorrect: levelFromCorrect,
    correctToNextLevel: correctToNextLevel,
    buildSet: buildSet,
    choicesFor: choicesFor,
    recordMistake: recordMistake,
    removeMistake: removeMistake
  };

  root.Eigo = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
