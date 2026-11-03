// 問題・保存のしくみの自動テスト
// 実行方法: node --test tests/logic.test.js
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const Items = require('../js/items.js');
const Problems = require('../js/problems.js');
const SaveData = require('../js/storage.js');
const Kanji = require('../js/kanji.js');
const Kokugo = require('../js/kokugo.js');
const KanjiStrokes = require('../js/kanji-strokes.js');
const Eigo = require('../js/eigo.js');
require('../js/eigo-art.js');
const Sound = require('../js/sound.js');
const EigoArt = globalThis.EigoArt;

function memoryStore(initial) {
  const map = new Map(Object.entries(initial || {}));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k)
  };
}

test('アイテム：さんすう12個（最初3個）、こくご10個（最初1個）、えいご9個', () => {
  assert.strictEqual(Items.ITEMS.length, 31);
  assert.strictEqual(Items.ownedIds({ sansu: 1, kokugo: 1, eigo: 1 }).length, 4);
  assert.strictEqual(Items.ownedIds({ sansu: 10, kokugo: 1, eigo: 1 }).length, 13);
  assert.strictEqual(Items.ownedIds({ sansu: 10, kokugo: 10, eigo: 1 }).length, 22);
  assert.strictEqual(Items.ownedIds({ sansu: 10, kokugo: 10, eigo: 10 }).length, 31);
  // どの教科も、レベル2〜10で1個ずつもらえる
  for (const subject of ['sansu', 'kokugo', 'eigo']) {
    for (let lv = 2; lv <= 10; lv++) {
      assert.strictEqual(Items.unlockedBetween(subject, lv - 1, lv).length, 1, subject + ' レベル' + lv);
    }
  }
  // 最初に着ているものは、最初から持っているもの
  const owned = Items.ownedIds({ sansu: 1, kokugo: 1 });
  Object.values(Items.DEFAULT_EQUIPPED).filter(Boolean).forEach((id) => assert.ok(owned.includes(id), id));
});

test('正解10問ごとにレベルが上がり、最高はレベル10', () => {
  assert.strictEqual(Problems.levelFromCorrect(0), 1);
  assert.strictEqual(Problems.levelFromCorrect(9), 1);
  assert.strictEqual(Problems.levelFromCorrect(10), 2);
  assert.strictEqual(Problems.levelFromCorrect(90), 10);
  assert.strictEqual(Problems.levelFromCorrect(500), 10);
  assert.strictEqual(Problems.correctToNextLevel(24), 6);
  assert.strictEqual(Problems.correctToNextLevel(95), 0);
});

test('各レベルの問題がルールどおりに作られる', () => {
  const checks = {
    1: (p, ans) => p.op === '+' && ans <= 5,
    2: (p, ans) => p.op === '+' && ans <= 10,
    3: (p, ans) => p.op === '-' && p.a <= 10,
    4: (p, ans) => p.a <= 10 && ans <= 10,
    5: (p, ans) => p.op === '+' && (p.a === 10 || p.b === 10) && ans > 10,
    6: (p, ans) => p.op === '+' && p.a <= 9 && p.b <= 9 && ans > 10 && ans <= 20,
    7: (p, ans) => p.op === '-' && p.a > 10 && p.a % 10 >= p.b,
    8: (p, ans) => p.op === '-' && p.a > 10 && p.a % 10 < p.b && p.b <= 9,
    9: (p, ans) => ans <= 20,
    10: (p, ans) => ans <= 20
  };
  for (let lv = 1; lv <= 10; lv++) {
    for (let i = 0; i < 300; i++) {
      const p = Problems.generateProblem(lv);
      const ans = Problems.answerOf(p);
      assert.ok(ans >= 0, `レベル${lv}で答えがマイナス: ${JSON.stringify(p)}`);
      assert.ok(String(ans).length <= 2, '答えは2ケタまで');
      assert.ok(checks[lv](p, ans), `レベル${lv}のルール違反: ${JSON.stringify(p)}`);
    }
  }
});

test('1回のあそびは5問で、間違えた問題は最大2問まざる', () => {
  const mistakes = [
    { a: 3, b: 2, op: '+', missCount: 1 },
    { a: 4, b: 1, op: '+', missCount: 1 },
    { a: 2, b: 2, op: '+', missCount: 1 },
    { a: 15, b: 7, op: '-', missCount: 1 } // レベル1では出せない
  ];
  for (let i = 0; i < 50; i++) {
    const set = Problems.buildSet(1, mistakes);
    assert.strictEqual(set.length, 5);
    const reviews = set.filter((p) => p.review);
    assert.strictEqual(reviews.length, 2);
    assert.ok(reviews.every((p) => Problems.fitsLevel(p, 1)));
  }
});

test('間違えた問題の記録：同じ問題は回数が増え、最大20件', () => {
  let list = [];
  list = Problems.recordMistake(list, { a: 3, b: 4, op: '+' }, 't1');
  list = Problems.recordMistake(list, { a: 5, b: 1, op: '-' }, 't2');
  list = Problems.recordMistake(list, { a: 3, b: 4, op: '+' }, 't3');
  assert.strictEqual(list.length, 2);
  assert.deepStrictEqual(list[0], { a: 3, b: 4, op: '+', missCount: 2, lastMissedAt: 't3' });
  list = Problems.removeMistake(list, { a: 3, b: 4, op: '+' });
  assert.strictEqual(list.length, 1);
  for (let i = 0; i < 30; i++) list = Problems.recordMistake(list, { a: i % 10, b: 0, op: i < 10 ? '+' : '-' }, 't');
  assert.ok(list.length <= 20);
});

test('タイマーはレベル8以上だけ', () => {
  assert.strictEqual(Problems.timerSeconds(7), 0);
  assert.strictEqual(Problems.timerSeconds(8), 30);
  assert.strictEqual(Problems.timerSeconds(9), 20);
  assert.strictEqual(Problems.timerSeconds(10), 15);
});

test('保存して読み込むと同じデータに戻る', () => {
  const store = memoryStore();
  const data = SaveData.defaultData();
  data.childName = 'はなこ';
  data.totalCorrect = 24;
  data.kokugo.totalCorrect = 9;
  data.eigo.totalCorrect = 17;
  data.settings.showKatakana = true;
  SaveData.refreshOwned(data);
  data.equipped.head = 'head_starpin';
  data.equipped.hair = 'hair_twin';
  data.equipped.eyewear = 'eye_heart';
  data.eigo.mistakes = Eigo.recordMistake([], 'B', '2026-11-03T00:00:00Z');
  data.mistakes = Problems.recordMistake([], { a: 7, b: 5, op: '-' }, '2026-10-28T00:00:00Z');
  data.kokugo.mistakes = Kokugo.recordMistake([], '山', '2026-10-31T00:00:00Z');
  assert.strictEqual(SaveData.save(data, store), true);
  const loaded = SaveData.load(store);
  assert.strictEqual(loaded.status, 'ok');
  assert.deepStrictEqual(loaded.data, data);
});

test('はじめて開いたときは初期状態', () => {
  const loaded = SaveData.load(memoryStore());
  assert.strictEqual(loaded.status, 'new');
  assert.strictEqual(loaded.data.level, 1);
  assert.strictEqual(loaded.data.childName, '');
});

test('壊れたデータでも止まらずに初期状態で起動する', () => {
  const loaded = SaveData.load(memoryStore({ [SaveData.KEY]: '{こわれた' }));
  assert.strictEqual(loaded.status, 'broken');
  assert.strictEqual(loaded.data.level, 1);
});

test('おかしな値は直される（レベルの食い違い・持っていない服・長すぎる名前）', () => {
  const raw = {
    childName: '  あいうえおかきくけこさしすせそ  ',
    level: 9,
    totalCorrect: 12,
    equipped: { head: 'head_tiara', clothes: 'unknown', shoes: 'shoes_pink', accessory: null },
    mistakes: [{ a: 3, b: 5, op: '-' }, { a: 1, b: 1, op: '+' }, 'x']
  };
  const data = SaveData.normalize(raw);
  assert.strictEqual(data.childName, 'あいうえおかきくけこ');
  assert.strictEqual(data.level, 2);
  assert.deepStrictEqual(data.ownedItems, Items.ownedIds({ sansu: 2, kokugo: 1, eigo: 1 }));
  assert.strictEqual(data.equipped.head, 'head_ribbon'); // ティアラはまだ持っていない
  assert.strictEqual(data.equipped.clothes, 'clothes_basic');
  assert.strictEqual(data.equipped.accessory, null);
  assert.strictEqual(data.mistakes.length, 1); // 3-5 はマイナスなので消える
});

test('アップデート前（version 1）のデータを、さんすうの記録を残したまま読み込める', () => {
  const v1 = {
    version: 1,
    childName: 'はなこ',
    level: 3,
    totalCorrect: 24,
    ownedItems: ['head_ribbon', 'clothes_basic', 'shoes_pink', 'head_starpin', 'clothes_dots'],
    equipped: { head: 'head_starpin', clothes: 'clothes_dots', shoes: 'shoes_pink', accessory: null },
    mistakes: [{ a: 7, b: 5, op: '-', missCount: 2, lastMissedAt: '2026-10-28T10:15:00+09:00' }],
    createdAt: '2026-10-28T09:00:00+09:00'
  };
  const loaded = SaveData.load(memoryStore({ [SaveData.KEY]: JSON.stringify(v1) }));
  const d = loaded.data;
  assert.strictEqual(loaded.status, 'ok');
  assert.strictEqual(d.childName, 'はなこ');
  assert.strictEqual(d.level, 3);
  assert.strictEqual(d.totalCorrect, 24);
  assert.strictEqual(d.equipped.head, 'head_starpin');
  assert.strictEqual(d.equipped.clothes, 'clothes_dots');
  assert.strictEqual(d.equipped.hair, 'hair_long');
  assert.strictEqual(d.equipped.pet, null);
  assert.strictEqual(d.mistakes.length, 1);
  assert.strictEqual(d.createdAt, v1.createdAt);
  assert.deepStrictEqual(d.kokugo, { level: 1, totalCorrect: 0, mistakes: [] });
  assert.deepStrictEqual(d.eigo, { level: 1, totalCorrect: 0, mistakes: [] });
  assert.deepStrictEqual(d.settings, { showKatakana: false, bgm: true, sfx: true });
  assert.strictEqual(d.version, 3);
});

test('こくご版（version 2）のデータを、記録を残したまま読み込める', () => {
  const v2 = {
    version: 2, childName: 'はなこ', level: 4, totalCorrect: 35,
    kokugo: { level: 3, totalCorrect: 18, mistakes: [{ kanji: '山', missCount: 1, lastMissedAt: 't' }] },
    equipped: { head: 'head_starpin', hair: 'hair_twin', clothes: 'clothes_dots', shoes: 'shoes_pink', accessory: 'acc_heart', pet: 'pet_cat', background: null },
    mistakes: [], createdAt: '2026-10-28T09:00:00+09:00'
  };
  const d = SaveData.normalize(v2);
  assert.strictEqual(d.level, 4);
  assert.strictEqual(d.kokugo.level, 3);
  assert.strictEqual(d.kokugo.mistakes.length, 1);
  assert.strictEqual(d.equipped.hair, 'hair_twin');
  assert.strictEqual(d.equipped.pet, 'pet_cat');
  assert.strictEqual(d.equipped.vehicle, null);
  assert.strictEqual(d.eigo.level, 1);
});

test('えいご：アルファベット26文字・単語56語、すべてに書き順か絵がある', () => {
  const letters = Eigo.ALL.filter((q) => q.type === 'letter');
  const words = Eigo.ALL.filter((q) => q.type === 'word');
  assert.strictEqual(letters.length, 26);
  assert.strictEqual(words.length, 56);
  assert.strictEqual(new Set(Eigo.ALL.map((q) => q.id)).size, 82);
  assert.strictEqual(Eigo.LEVELS.length, 10);
  letters.forEach((q) => {
    assert.ok(q.level <= 3, q.id);
    const strokes = Eigo.LETTER_STROKES[q.id];
    assert.ok(Array.isArray(strokes) && strokes.length > 0, q.id + ' の書き順');
    strokes.forEach((d) => assert.ok(/^M/.test(d), q.id));
    assert.ok(q.say && q.kana, q.id);
  });
  words.forEach((q) => {
    assert.ok(q.level >= 4, q.id);
    assert.ok(EigoArt.has(q.id), q.id + ' の絵');
    assert.ok(q.ja && q.kana, q.id);
  });
  for (let lv = 4; lv <= 10; lv++) assert.strictEqual(Eigo.LEVELS[lv - 1].length, 8, 'レベル' + lv);
});

test('えいご：正解8問ごとにレベルが上がる', () => {
  assert.strictEqual(Eigo.levelFromCorrect(7), 1);
  assert.strictEqual(Eigo.levelFromCorrect(8), 2);
  assert.strictEqual(Eigo.levelFromCorrect(1000), 10);
  assert.strictEqual(Eigo.correctToNextLevel(3), 5);
});

test('えいご：1回4問で、1問は間違えた問題か前のレベルの問題。選択肢は同じレベルから3つ', () => {
  for (let i = 0; i < 100; i++) {
    const s1 = Eigo.buildSet(1, []);
    assert.strictEqual(s1.length, 4);
    assert.ok(s1.every((q) => Eigo.get(q.id).level === 1));
    assert.strictEqual(new Set(s1.map((q) => q.id)).size, 4);

    const s5 = Eigo.buildSet(5, []);
    const levels = s5.map((q) => Eigo.get(q.id).level);
    assert.strictEqual(levels.filter((lv) => lv < 5).length, 1);
    assert.strictEqual(levels.filter((lv) => lv === 5).length, 3);

    const s2 = Eigo.buildSet(2, [{ id: 'C', missCount: 1 }, { id: 'apple', missCount: 1 }]);
    assert.ok(s2.some((q) => q.id === 'C' && q.review));
    assert.ok(!s2.some((q) => q.id === 'apple'));

    for (const id of ['A', 'cat', 'rainbow']) {
      const c = Eigo.choicesFor(id);
      assert.strictEqual(c.length, 3);
      assert.strictEqual(new Set(c).size, 3);
      assert.ok(c.includes(id));
      assert.ok(c.every((x) => Eigo.get(x).level === Eigo.get(id).level));
    }
  }
});

test('えいご：間違えた問題の記録', () => {
  let list = Eigo.recordMistake([], 'B', 't1');
  list = Eigo.recordMistake(list, 'B', 't2');
  assert.deepStrictEqual(list, [{ id: 'B', missCount: 2, lastMissedAt: 't2' }]);
  assert.strictEqual(Eigo.removeMistake(list, 'B').length, 0);
});

test('こくご：漢字は80字・1レベル8字で、重なりがない', () => {
  assert.strictEqual(Kanji.ALL.length, 80);
  assert.strictEqual(new Set(Kanji.ALL.map((k) => k.kanji)).size, 80);
  Kanji.LEVELS.forEach((list, i) => assert.strictEqual(list.length, 8, 'レベル' + (i + 1)));
});

test('こくご：例文と選択肢が正しく作られている', () => {
  const hiragana = /^[ぁ-ゖー 　]*$/;
  for (const k of Kanji.ALL) {
    assert.ok(hiragana.test(k.before) && hiragana.test(k.after), k.kanji + ' の例文に ひらがな以外がある');
    assert.ok(hiragana.test(k.reading), k.kanji + ' の読み');
    assert.strictEqual(k.wrong.length, 2, k.kanji);
    assert.strictEqual(new Set([k.reading].concat(k.wrong)).size, 3, k.kanji + ' の選択肢が重なっている');
    assert.strictEqual(Kokugo.choicesFor(k.kanji).length, 3);
  }
});

test('こくご：80字すべてに書き順データがある', () => {
  for (const k of Kanji.ALL) {
    const strokes = KanjiStrokes[k.kanji];
    assert.ok(Array.isArray(strokes) && strokes.length > 0, k.kanji);
    strokes.forEach((d) => assert.ok(/^[Mm]/.test(d), k.kanji + ' の線のデータ'));
  }
  // いくつかの字は画数も確かめる
  assert.strictEqual(KanjiStrokes['一'].length, 1);
  assert.strictEqual(KanjiStrokes['山'].length, 3);
  assert.strictEqual(KanjiStrokes['森'].length, 12);
  assert.strictEqual(KanjiStrokes['校'].length, 10);
});

test('こくご：正解8問ごとにレベルが上がり、最高はレベル10', () => {
  assert.strictEqual(Kokugo.levelFromCorrect(7), 1);
  assert.strictEqual(Kokugo.levelFromCorrect(8), 2);
  assert.strictEqual(Kokugo.levelFromCorrect(72), 10);
  assert.strictEqual(Kokugo.levelFromCorrect(999), 10);
  assert.strictEqual(Kokugo.correctToNextLevel(10), 6);
  assert.strictEqual(Kokugo.correctToNextLevel(80), 0);
});

test('こくご：1回3問で、1問は間違えた字か前のレベルの字', () => {
  for (let i = 0; i < 100; i++) {
    // レベル1・間違いなし → 3問ともレベル1の字
    const s1 = Kokugo.buildSet(1, []);
    assert.strictEqual(s1.length, 3);
    assert.strictEqual(new Set(s1.map((q) => q.kanji)).size, 3);
    assert.ok(s1.every((q) => Kanji.getKanji(q.kanji).level === 1));

    // レベル3・間違いなし → 1問は前のレベル、2問はレベル3
    const s3 = Kokugo.buildSet(3, []);
    const levels = s3.map((q) => Kanji.getKanji(q.kanji).level);
    assert.strictEqual(levels.filter((lv) => lv < 3).length, 1);
    assert.strictEqual(levels.filter((lv) => lv === 3).length, 2);

    // 間違えた字があればそれが出る（まだ習っていないレベルの字は出ない）
    const mistakes = [{ kanji: '村', missCount: 1 }, { kanji: '火', missCount: 1 }];
    const s2 = Kokugo.buildSet(2, mistakes);
    assert.ok(s2.some((q) => q.kanji === '火' && q.review));
    assert.ok(!s2.some((q) => q.kanji === '村'));
  }
});

test('こくご：間違えた字の記録', () => {
  let list = Kokugo.recordMistake([], '山', 't1');
  list = Kokugo.recordMistake(list, '川', 't2');
  list = Kokugo.recordMistake(list, '山', 't3');
  assert.deepStrictEqual(list[0], { kanji: '山', missCount: 2, lastMissedAt: 't3' });
  assert.strictEqual(Kokugo.removeMistake(list, '山').length, 1);
});

test('保存に失敗しても false を返すだけで止まらない', () => {
  const broken = { getItem() { throw new Error('x'); }, setItem() { throw new Error('full'); }, removeItem() { throw new Error('x'); } };
  assert.strictEqual(SaveData.save(SaveData.defaultData(), broken), false);
  assert.strictEqual(SaveData.load(broken).status, 'broken');
});

test('音の設定：最初はBGM・効果音ともオン。前の版のデータもオンになり、オフにしたら保たれる', () => {
  const fresh = SaveData.defaultData();
  assert.strictEqual(fresh.settings.bgm, true);
  assert.strictEqual(fresh.settings.sfx, true);
  const old = SaveData.normalize({ version: 3, childName: 'はな', totalCorrect: 12, settings: { showKatakana: true } });
  assert.deepStrictEqual(old.settings, { showKatakana: true, bgm: true, sfx: true });
  assert.strictEqual(old.level, 2);
  const off = SaveData.normalize({ version: 3, settings: { bgm: false, sfx: false } });
  assert.strictEqual(off.settings.bgm, false);
  assert.strictEqual(off.settings.sfx, false);
});

test('BGM：2曲とも楽譜が正しく、パートの長さがそろっている', () => {
  ['home', 'quiz'].forEach((name) => {
    const tracks = Sound.SONGS[name].tracks.map((t) => Sound.parseTrack(t.notes));
    tracks.forEach((t) => {
      assert.strictEqual(t.length, 64, name);
      t.steps.forEach((s) => { if (s) assert.ok(s.freq > 50 && s.freq < 3000, name); });
    });
  });
  assert.ok(Math.abs(Sound.noteFreq('A4') - 440) < 0.01);
  assert.strictEqual(Sound.noteFreq('H4'), null);
});

test('オフライン用の一覧（sw.js）にあるファイルが、すべて実際にある', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const sw = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
  const files = sw.match(/'\.\/[^']+'/g).map((s) => s.slice(3, -1)).filter((f) => f !== '');
  assert.ok(files.length > 20);
  files.forEach((f) => assert.ok(fs.existsSync(path.join(__dirname, '..', f)), f));
});
