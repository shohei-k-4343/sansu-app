// データの保存と読み込み（SPEC.md 6「データ構造」）
// データは iPad の中（localStorage）だけに保存し、外には送らない
(function (root) {
  'use strict';

  var Items = root.Items || require('./items.js');
  var Problems = root.Problems || require('./problems.js');

  var KEY = 'sansu-app-v1';
  var VERSION = 1;
  var MAX_NAME_LENGTH = 10;

  function defaultData() {
    return {
      version: VERSION,
      childName: '',
      level: 1,
      totalCorrect: 0,
      ownedItems: Items.idsUpToLevel(1),
      equipped: Object.assign({}, Items.DEFAULT_EQUIPPED),
      mistakes: [],
      createdAt: new Date().toISOString()
    };
  }

  function cleanName(name) {
    return String(name || '').trim().slice(0, MAX_NAME_LENGTH);
  }

  function isValidProblem(m) {
    return m && Number.isInteger(m.a) && Number.isInteger(m.b) &&
      m.a >= 0 && m.b >= 0 && m.a <= 20 && m.b <= 20 &&
      (m.op === '+' || m.op === '-') && Problems.answerOf(m) >= 0;
  }

  // 読み込んだデータを点検して、おかしいところを直す
  function normalize(raw) {
    var data = defaultData();
    if (!raw || typeof raw !== 'object') return data;

    data.childName = cleanName(raw.childName);

    var total = Number(raw.totalCorrect);
    data.totalCorrect = Number.isInteger(total) && total >= 0 ? total : 0;
    // レベルは正解数から決まる（食い違っていたら正解数を正しいものとする）
    data.level = Problems.levelFromCorrect(data.totalCorrect);
    data.ownedItems = Items.idsUpToLevel(data.level);

    var eq = raw.equipped && typeof raw.equipped === 'object' ? raw.equipped : {};
    Items.SLOTS.forEach(function (slot) {
      var id = eq[slot.id];
      var item = Items.getItem(id);
      if (item && item.slot === slot.id && data.ownedItems.indexOf(id) !== -1) {
        data.equipped[slot.id] = id;
      } else if (id === null && slot.allowNone) {
        data.equipped[slot.id] = null;
      }
    });

    if (Array.isArray(raw.mistakes)) {
      data.mistakes = raw.mistakes.filter(isValidProblem).slice(0, Problems.MAX_MISTAKES).map(function (m) {
        return {
          a: m.a,
          b: m.b,
          op: m.op,
          missCount: Number.isInteger(m.missCount) && m.missCount > 0 ? m.missCount : 1,
          lastMissedAt: typeof m.lastMissedAt === 'string' ? m.lastMissedAt : data.createdAt
        };
      });
    }

    if (typeof raw.createdAt === 'string') data.createdAt = raw.createdAt;
    return data;
  }

  // 戻り値の status: 'new'（はじめて） / 'ok' / 'broken'（壊れていたので初期状態にした）
  function load(storage) {
    var store = storage || root.localStorage;
    try {
      var text = store.getItem(KEY);
      if (!text) return { data: defaultData(), status: 'new' };
      return { data: normalize(JSON.parse(text)), status: 'ok' };
    } catch (e) {
      return { data: defaultData(), status: 'broken' };
    }
  }

  // 保存できたら true
  function save(data, storage) {
    var store = storage || root.localStorage;
    try {
      store.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clear(storage) {
    var store = storage || root.localStorage;
    try {
      store.removeItem(KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  var api = {
    KEY: KEY,
    MAX_NAME_LENGTH: MAX_NAME_LENGTH,
    defaultData: defaultData,
    cleanName: cleanName,
    normalize: normalize,
    load: load,
    save: save,
    clear: clear
  };

  // ※ ブラウザに最初からある「Storage」と名前がぶつからないよう SaveData とする
  root.SaveData = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
