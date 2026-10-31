// こくご：小学1年生の漢字80字（SPEC.md 14-5）
// before / after: 例文のうち、漢字の前と後ろ（ひらがなだけで書く）
// reading: 漢字の読み（正解） / wrong: まちがいの選択肢2つ
(function (root) {
  'use strict';

  var LEVELS = [
    // レベル1
    [
      { kanji: '一', before: 'りんごが ', after: 'つ', reading: 'ひと', wrong: ['ふた', 'み'] },
      { kanji: '二', before: 'えんぴつが ', after: 'ほん', reading: 'に', wrong: ['いち', 'さん'] },
      { kanji: '三', before: 'おにぎりを ', after: 'こ たべる', reading: 'さん', wrong: ['に', 'し'] },
      { kanji: '山', before: '', after: 'に のぼる', reading: 'やま', wrong: ['かわ', 'もり'] },
      { kanji: '川', before: '', after: 'で あそぶ', reading: 'かわ', wrong: ['やま', 'うみ'] },
      { kanji: '木', before: '', after: 'に のぼる', reading: 'き', wrong: ['め', 'て'] },
      { kanji: '口', before: '', after: 'を あける', reading: 'くち', wrong: ['みみ', 'はな'] },
      { kanji: '日', before: '', after: 'が のぼる', reading: 'ひ', wrong: ['き', 'つき'] }
    ],
    // レベル2
    [
      { kanji: '月', before: 'お', after: 'さま', reading: 'つき', wrong: ['ひ', 'ほし'] },
      { kanji: '火', before: '', after: 'を けす', reading: 'ひ', wrong: ['みず', 'き'] },
      { kanji: '水', before: '', after: 'を のむ', reading: 'みず', wrong: ['ひ', 'つち'] },
      { kanji: '金', before: '', after: 'ようび', reading: 'きん', wrong: ['もく', 'ぎん'] },
      { kanji: '土', before: '', after: 'を ほる', reading: 'つち', wrong: ['すな', 'いし'] },
      { kanji: '田', before: '', after: 'んぼ', reading: 'た', wrong: ['ち', 'は'] },
      { kanji: '人', before: '', after: 'が あるく', reading: 'ひと', wrong: ['いぬ', 'とり'] },
      { kanji: '目', before: '', after: 'を とじる', reading: 'め', wrong: ['て', 'き'] }
    ],
    // レベル3
    [
      { kanji: '四', before: 'いちごを ', after: 'こ', reading: 'よん', wrong: ['ご', 'ろく'] },
      { kanji: '五', before: '', after: 'えんだま', reading: 'ご', wrong: ['に', 'く'] },
      { kanji: '六', before: '', after: 'さい', reading: 'ろく', wrong: ['なな', 'はち'] },
      { kanji: '七', before: '', after: 'いろの にじ', reading: 'なな', wrong: ['ろく', 'はち'] },
      { kanji: '八', before: '', after: 'にん', reading: 'はち', wrong: ['なな', 'きゅう'] },
      { kanji: '九', before: 'いちから ', after: 'まで', reading: 'きゅう', wrong: ['はち', 'じゅう'] },
      { kanji: '十', before: '', after: 'えん', reading: 'じゅう', wrong: ['ひゃく', 'せん'] },
      { kanji: '百', before: '', after: 'てん まんてん', reading: 'ひゃく', wrong: ['じゅう', 'せん'] }
    ],
    // レベル4
    [
      { kanji: '上', before: 'つくえの ', after: '', reading: 'うえ', wrong: ['した', 'なか'] },
      { kanji: '下', before: 'いすの ', after: '', reading: 'した', wrong: ['うえ', 'よこ'] },
      { kanji: '中', before: 'はこの ', after: '', reading: 'なか', wrong: ['そと', 'うえ'] },
      { kanji: '大', before: '', after: 'きな いぬ', reading: 'おお', wrong: ['ちい', 'なが'] },
      { kanji: '小', before: '', after: 'さな むし', reading: 'ちい', wrong: ['おお', 'ほそ'] },
      { kanji: '子', before: '', after: 'ども', reading: 'こ', wrong: ['お', 'め'] },
      { kanji: '女', before: '', after: 'の こ', reading: 'おんな', wrong: ['おとこ', 'おとな'] },
      { kanji: '男', before: '', after: 'の こ', reading: 'おとこ', wrong: ['おんな', 'おとな'] }
    ],
    // レベル5
    [
      { kanji: '手', before: '', after: 'を あらう', reading: 'て', wrong: ['め', 'あし'] },
      { kanji: '足', before: '', after: 'が はやい', reading: 'あし', wrong: ['て', 'くび'] },
      { kanji: '耳', before: '', after: 'を すます', reading: 'みみ', wrong: ['はな', 'くち'] },
      { kanji: '犬', before: '', after: 'が ほえる', reading: 'いぬ', wrong: ['ねこ', 'うし'] },
      { kanji: '虫', before: '', after: 'を つかまえる', reading: 'むし', wrong: ['とり', 'さかな'] },
      { kanji: '貝', before: '', after: 'を ひろう', reading: 'かい', wrong: ['いし', 'はな'] },
      { kanji: '竹', before: '', after: 'の こ', reading: 'たけ', wrong: ['まつ', 'うめ'] },
      { kanji: '草', before: '', after: 'を ぬく', reading: 'くさ', wrong: ['はな', 'き'] }
    ],
    // レベル6
    [
      { kanji: '花', before: '', after: 'が さく', reading: 'はな', wrong: ['くさ', 'め'] },
      { kanji: '森', before: '', after: 'の どうぶつ', reading: 'もり', wrong: ['はやし', 'やま'] },
      { kanji: '林', before: '', after: 'の なか', reading: 'はやし', wrong: ['もり', 'かわ'] },
      { kanji: '石', before: '', after: 'を なげる', reading: 'いし', wrong: ['すな', 'かい'] },
      { kanji: '雨', before: '', after: 'が ふる', reading: 'あめ', wrong: ['ゆき', 'かぜ'] },
      { kanji: '空', before: 'あおい ', after: '', reading: 'そら', wrong: ['うみ', 'やま'] },
      { kanji: '天', before: '', after: 'きよほう', reading: 'てん', wrong: ['でん', 'せん'] },
      { kanji: '気', before: '', after: 'もちが いい', reading: 'き', wrong: ['け', 'ひ'] }
    ],
    // レベル7
    [
      { kanji: '白', before: '', after: 'い くも', reading: 'しろ', wrong: ['くろ', 'あか'] },
      { kanji: '青', before: '', after: 'い うみ', reading: 'あお', wrong: ['あか', 'しろ'] },
      { kanji: '赤', before: '', after: 'い りんご', reading: 'あか', wrong: ['あお', 'きい'] },
      { kanji: '円', before: 'ひゃく', after: '', reading: 'えん', wrong: ['いん', 'おん'] },
      { kanji: '千', before: '', after: 'えんさつ', reading: 'せん', wrong: ['ひゃく', 'まん'] },
      { kanji: '年', before: 'いち', after: 'せい', reading: 'ねん', wrong: ['にち', 'がつ'] },
      { kanji: '早', before: 'あさ ', after: 'く おきる', reading: 'はや', wrong: ['おそ', 'なが'] },
      { kanji: '夕', before: '', after: 'やけ', reading: 'ゆう', wrong: ['あさ', 'よる'] }
    ],
    // レベル8
    [
      { kanji: '入', before: 'おふろに ', after: 'る', reading: 'はい', wrong: ['で', 'み'] },
      { kanji: '出', before: 'そとに ', after: 'る', reading: 'で', wrong: ['はい', 'ね'] },
      { kanji: '立', before: 'せんせいが ', after: 'つ', reading: 'た', wrong: ['ま', 'か'] },
      { kanji: '休', before: '', after: 'みの ひ', reading: 'やす', wrong: ['あそ', 'まな'] },
      { kanji: '見', before: 'えほんを ', after: 'る', reading: 'み', wrong: ['き', 'ね'] },
      { kanji: '生', before: 'あかちゃんが ', after: 'まれる', reading: 'う', wrong: ['い', 'え'] },
      { kanji: '正', before: '', after: 'しい こたえ', reading: 'ただ', wrong: ['たの', 'うれ'] },
      { kanji: '本', before: '', after: 'を よむ', reading: 'ほん', wrong: ['え', 'て'] }
    ],
    // レベル9
    [
      { kanji: '右', before: '', after: 'て', reading: 'みぎ', wrong: ['ひだり', 'うえ'] },
      { kanji: '左', before: '', after: 'あし', reading: 'ひだり', wrong: ['みぎ', 'した'] },
      { kanji: '王', before: '', after: 'さま', reading: 'おう', wrong: ['ひめ', 'かみ'] },
      { kanji: '玉', before: '', after: 'いれ', reading: 'たま', wrong: ['いし', 'はこ'] },
      { kanji: '糸', before: '', after: 'で ぬう', reading: 'いと', wrong: ['ひも', 'はり'] },
      { kanji: '車', before: '', after: 'に のる', reading: 'くるま', wrong: ['ふね', 'でんしゃ'] },
      { kanji: '力', before: '', after: 'もち', reading: 'ちから', wrong: ['こころ', 'からだ'] },
      { kanji: '音', before: '', after: 'が きこえる', reading: 'おと', wrong: ['こえ', 'うた'] }
    ],
    // レベル10
    [
      { kanji: '学', before: '', after: 'ぶ', reading: 'まな', wrong: ['あそ', 'やす'] },
      { kanji: '校', before: 'がっ', after: '', reading: 'こう', wrong: ['ごう', 'きょう'] },
      { kanji: '先', before: '', after: 'せい', reading: 'せん', wrong: ['ぜん', 'てん'] },
      { kanji: '字', before: '', after: 'を かく', reading: 'じ', wrong: ['え', 'し'] },
      { kanji: '文', before: '', after: 'を よむ', reading: 'ぶん', wrong: ['ほん', 'もん'] },
      { kanji: '名', before: '', after: 'まえを かく', reading: 'な', wrong: ['は', 'と'] },
      { kanji: '町', before: '', after: 'を あるく', reading: 'まち', wrong: ['むら', 'みち'] },
      { kanji: '村', before: '', after: 'の まつり', reading: 'むら', wrong: ['まち', 'もり'] }
    ]
  ];

  var ALL = [];
  LEVELS.forEach(function (list, i) {
    list.forEach(function (k) {
      k.level = i + 1;
      ALL.push(k);
    });
  });

  function getKanji(ch) {
    for (var i = 0; i < ALL.length; i++) {
      if (ALL[i].kanji === ch) return ALL[i];
    }
    return null;
  }

  var api = {
    LEVELS: LEVELS,
    ALL: ALL,
    getKanji: getKanji
  };

  root.Kanji = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
