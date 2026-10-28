// アイテムの一覧（SPEC.md 4-1「ごほうび」）
(function (root) {
  'use strict';

  var SLOTS = [
    { id: 'head', name: 'あたま', allowNone: true },
    { id: 'clothes', name: 'ふく', allowNone: false },
    { id: 'shoes', name: 'くつ', allowNone: false },
    { id: 'accessory', name: 'アクセサリー', allowNone: true }
  ];

  // level: もらえるレベル（1 は最初から持っている）
  var ITEMS = [
    { id: 'head_ribbon', name: 'リボン', slot: 'head', level: 1 },
    { id: 'clothes_basic', name: 'きほんの ワンピース', slot: 'clothes', level: 1 },
    { id: 'shoes_pink', name: 'ピンクの くつ', slot: 'shoes', level: 1 },
    { id: 'head_starpin', name: 'ほしの ヘアピン', slot: 'head', level: 2 },
    { id: 'clothes_dots', name: 'みずたま ワンピース', slot: 'clothes', level: 3 },
    { id: 'acc_heart', name: 'ハートの ネックレス', slot: 'accessory', level: 4 },
    { id: 'shoes_sparkle', name: 'キラキラ くつ', slot: 'shoes', level: 5 },
    { id: 'head_catears', name: 'ねこみみ カチューシャ', slot: 'head', level: 6 },
    { id: 'clothes_rainbow', name: 'にじいろ ドレス', slot: 'clothes', level: 7 },
    { id: 'acc_bag', name: 'ちいさな バッグ', slot: 'accessory', level: 8 },
    { id: 'shoes_glass', name: 'ガラスの くつ', slot: 'shoes', level: 9 },
    { id: 'head_tiara', name: 'プリンセスの ティアラ', slot: 'head', level: 10 }
  ];

  var DEFAULT_EQUIPPED = {
    head: 'head_ribbon',
    clothes: 'clothes_basic',
    shoes: 'shoes_pink',
    accessory: null
  };

  function getItem(id) {
    for (var i = 0; i < ITEMS.length; i++) {
      if (ITEMS[i].id === id) return ITEMS[i];
    }
    return null;
  }

  function itemsInSlot(slotId) {
    return ITEMS.filter(function (item) { return item.slot === slotId; });
  }

  // そのレベルまでに持っているアイテムのID
  function idsUpToLevel(level) {
    return ITEMS.filter(function (item) { return item.level <= level; })
      .map(function (item) { return item.id; });
  }

  // fromLevel より上、toLevel 以下で新しくもらえるアイテム
  function unlockedBetween(fromLevel, toLevel) {
    return ITEMS.filter(function (item) {
      return item.level > fromLevel && item.level <= toLevel;
    });
  }

  var api = {
    SLOTS: SLOTS,
    ITEMS: ITEMS,
    DEFAULT_EQUIPPED: DEFAULT_EQUIPPED,
    getItem: getItem,
    itemsInSlot: itemsInSlot,
    idsUpToLevel: idsUpToLevel,
    unlockedBetween: unlockedBetween
  };

  root.Items = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
