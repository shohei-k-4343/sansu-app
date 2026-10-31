// こくご：問題を作るしくみ（SPEC.md 14-2「ルール」）
(function (root) {
  'use strict';

  var Kanji = root.Kanji || require('./kanji.js');

  var MAX_LEVEL = 10;
  var CORRECT_PER_LEVEL = 8;
  var QUESTIONS_PER_SET = 3;
  var MAX_MISTAKES = 20;

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

  // 1回のあそび（3問）を作る。1問は「間違えた字」か「前のレベルの字」にする
  function buildSet(level, mistakes) {
    level = clampLevel(level);
    var review = null;

    var missed = (mistakes || []).map(function (m) { return Kanji.getKanji(m.kanji); })
      .filter(function (k) { return k && k.level <= level; });
    if (missed.length > 0) {
      review = missed[randInt(0, missed.length - 1)];
    } else if (level > 1) {
      var older = Kanji.ALL.filter(function (k) { return k.level < level; });
      review = older[randInt(0, older.length - 1)];
    }

    var set = [];
    if (review) set.push({ kanji: review.kanji, review: true });
    shuffle(Kanji.LEVELS[level - 1]).forEach(function (k) {
      if (set.length < QUESTIONS_PER_SET && (!review || k.kanji !== review.kanji)) {
        set.push({ kanji: k.kanji, review: false });
      }
    });
    return shuffle(set);
  }

  // 読みの選択肢（正解1つ＋まちがい2つを、ばらばらの順番で）
  function choicesFor(ch) {
    var k = Kanji.getKanji(ch);
    return shuffle([k.reading].concat(k.wrong));
  }

  function recordMistake(mistakes, ch, nowIso) {
    var list = (mistakes || []).slice();
    var existing = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].kanji === ch) {
        existing = list.splice(i, 1)[0];
        break;
      }
    }
    list.unshift({ kanji: ch, missCount: existing ? existing.missCount + 1 : 1, lastMissedAt: nowIso });
    return list.slice(0, MAX_MISTAKES);
  }

  function removeMistake(mistakes, ch) {
    return (mistakes || []).filter(function (m) { return m.kanji !== ch; });
  }

  var api = {
    MAX_LEVEL: MAX_LEVEL,
    CORRECT_PER_LEVEL: CORRECT_PER_LEVEL,
    QUESTIONS_PER_SET: QUESTIONS_PER_SET,
    MAX_MISTAKES: MAX_MISTAKES,
    levelFromCorrect: levelFromCorrect,
    correctToNextLevel: correctToNextLevel,
    buildSet: buildSet,
    choicesFor: choicesFor,
    recordMistake: recordMistake,
    removeMistake: removeMistake
  };

  root.Kokugo = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
