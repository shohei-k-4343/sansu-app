// 問題を作るしくみ（SPEC.md 4-1「レベルアップ」「4-2 苦手な問題の復習」）
(function (root) {
  'use strict';

  var MAX_LEVEL = 10;
  var CORRECT_PER_LEVEL = 10;
  var QUESTIONS_PER_SET = 5;
  var MAX_REVIEW_PER_SET = 2;
  var MAX_MISTAKES = 20;
  var TIMER_SECONDS = { 8: 30, 9: 20, 10: 15 };

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

  // 問題の種類ごとの作り方
  var generators = {
    // たし算（答えが5まで）
    addTo5: function () {
      var sum = randInt(2, 5);
      var a = randInt(1, sum - 1);
      return { a: a, b: sum - a, op: '+' };
    },
    // たし算（答えが10まで）
    addTo10: function () {
      var sum = randInt(3, 10);
      var a = randInt(1, sum - 1);
      return { a: a, b: sum - a, op: '+' };
    },
    // ひき算（10までの数）
    subWithin10: function () {
      var a = randInt(2, 10);
      return { a: a, b: randInt(1, a - 1), op: '-' };
    },
    // たし算（10＋いくつ）
    tenPlus: function () {
      var n = randInt(1, 9);
      return Math.random() < 0.5 ? { a: 10, b: n, op: '+' } : { a: n, b: 10, op: '+' };
    },
    // たし算（答えが20まで、くり上がりあり）
    addCarry: function () {
      var a = randInt(2, 9);
      return { a: a, b: randInt(Math.max(2, 11 - a), 9), op: '+' };
    },
    // ひき算（20までの数、くり下がりなし）
    subNoBorrow: function () {
      var a = randInt(11, 19);
      return { a: a, b: randInt(1, a % 10), op: '-' };
    },
    // ひき算（20までの数、くり下がりあり）
    subBorrow: function () {
      var a = randInt(11, 18);
      return { a: a, b: randInt(a % 10 + 1, 9), op: '-' };
    }
  };

  var LEVEL_RULES = {
    1: ['addTo5'],
    2: ['addTo10'],
    3: ['subWithin10'],
    4: ['addTo10', 'subWithin10'],
    5: ['tenPlus'],
    6: ['addCarry'],
    7: ['subNoBorrow'],
    8: ['subBorrow'],
    9: ['addCarry', 'subNoBorrow', 'subBorrow', 'tenPlus'],
    10: ['addCarry', 'subNoBorrow', 'subBorrow', 'tenPlus']
  };

  function clampLevel(level) {
    return Math.min(MAX_LEVEL, Math.max(1, Math.floor(level) || 1));
  }

  function levelFromCorrect(totalCorrect) {
    return clampLevel(Math.floor(totalCorrect / CORRECT_PER_LEVEL) + 1);
  }

  // 次のレベルまであと何問か（最高レベルなら 0）
  function correctToNextLevel(totalCorrect) {
    if (levelFromCorrect(totalCorrect) >= MAX_LEVEL) return 0;
    return CORRECT_PER_LEVEL - (totalCorrect % CORRECT_PER_LEVEL);
  }

  function maxNumber(level) {
    return level <= 4 ? 10 : 20;
  }

  function answerOf(p) {
    return p.op === '+' ? p.a + p.b : p.a - p.b;
  }

  function sameProblem(p, q) {
    return p.a === q.a && p.b === q.b && p.op === q.op;
  }

  function generateProblem(level) {
    var rules = LEVEL_RULES[clampLevel(level)];
    return generators[rules[randInt(0, rules.length - 1)]]();
  }

  // 今のレベルで出してよい問題か（数がそのレベルの範囲に入っているか）
  function fitsLevel(p, level) {
    var max = maxNumber(clampLevel(level));
    var ans = answerOf(p);
    return p.a <= max && p.b <= max && ans >= 0 && ans <= max;
  }

  // 1回のあそび（5問）を作る。間違えた問題から最大2問をまぜる
  function buildSet(level, mistakes) {
    var set = [];
    var candidates = shuffle((mistakes || []).filter(function (m) { return fitsLevel(m, level); }));
    candidates.slice(0, MAX_REVIEW_PER_SET).forEach(function (m) {
      set.push({ a: m.a, b: m.b, op: m.op, review: true });
    });

    var tries = 0;
    while (set.length < QUESTIONS_PER_SET) {
      var p = generateProblem(level);
      var dup = set.some(function (q) { return sameProblem(p, q); });
      // 同じ問題ばかりにならないようにするが、作れる種類が少ないときはあきらめる
      if (!dup || tries > 50) {
        p.review = false;
        set.push(p);
      }
      tries++;
    }
    return shuffle(set);
  }

  // 間違えた問題を記録する（新しい順・最大20件）
  function recordMistake(mistakes, p, nowIso) {
    var list = (mistakes || []).slice();
    var existing = null;
    for (var i = 0; i < list.length; i++) {
      if (sameProblem(list[i], p)) {
        existing = list.splice(i, 1)[0];
        break;
      }
    }
    list.unshift({
      a: p.a,
      b: p.b,
      op: p.op,
      missCount: existing ? existing.missCount + 1 : 1,
      lastMissedAt: nowIso
    });
    return list.slice(0, MAX_MISTAKES);
  }

  function removeMistake(mistakes, p) {
    return (mistakes || []).filter(function (m) { return !sameProblem(m, p); });
  }

  function timerSeconds(level) {
    return TIMER_SECONDS[clampLevel(level)] || 0;
  }

  // おとなロック用の問題（かけ算）
  function adultQuestion() {
    var a = randInt(6, 9);
    var b = randInt(6, 9);
    return { a: a, b: b, answer: a * b };
  }

  var api = {
    MAX_LEVEL: MAX_LEVEL,
    CORRECT_PER_LEVEL: CORRECT_PER_LEVEL,
    QUESTIONS_PER_SET: QUESTIONS_PER_SET,
    MAX_MISTAKES: MAX_MISTAKES,
    LEVEL_RULES: LEVEL_RULES,
    generators: generators,
    levelFromCorrect: levelFromCorrect,
    correctToNextLevel: correctToNextLevel,
    maxNumber: maxNumber,
    answerOf: answerOf,
    sameProblem: sameProblem,
    generateProblem: generateProblem,
    fitsLevel: fitsLevel,
    buildSet: buildSet,
    recordMistake: recordMistake,
    removeMistake: removeMistake,
    timerSeconds: timerSeconds,
    adultQuestion: adultQuestion
  };

  root.Problems = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
