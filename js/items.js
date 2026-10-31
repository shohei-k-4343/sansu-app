// アイテムの一覧（SPEC.md 4-1「ごほうび」・14-6「こくご のアイテム」）
(function (root) {
  'use strict';

  // きせかえ画面のタブの順番
  var SLOTS = [
    { id: 'head', name: 'あたま', allowNone: true },
    { id: 'hair', name: 'かみがた', allowNone: false },
    { id: 'clothes', name: 'ふく', allowNone: false },
    { id: 'shoes', name: 'くつ', allowNone: false },
    { id: 'accessory', name: 'アクセサリー', allowNone: true },
    { id: 'pet', name: 'ペット', allowNone: true },
    { id: 'background', name: 'はいけい', allowNone: true }
  ];

  var SUBJECT_NAMES = { sansu: 'さんすう', kokugo: 'こくご' };

  // subject: どの教科でもらえるか / level: その教科の何レベルでもらえるか（1 は最初から持っている）
  var ITEMS = [
    { id: 'head_ribbon', name: 'リボン', slot: 'head', subject: 'sansu', level: 1 },
    { id: 'clothes_basic', name: 'きほんの ワンピース', slot: 'clothes', subject: 'sansu', level: 1 },
    { id: 'shoes_pink', name: 'ピンクの くつ', slot: 'shoes', subject: 'sansu', level: 1 },
    { id: 'head_starpin', name: 'ほしの ヘアピン', slot: 'head', subject: 'sansu', level: 2 },
    { id: 'clothes_dots', name: 'みずたま ワンピース', slot: 'clothes', subject: 'sansu', level: 3 },
    { id: 'acc_heart', name: 'ハートの ネックレス', slot: 'accessory', subject: 'sansu', level: 4 },
    { id: 'shoes_sparkle', name: 'キラキラ くつ', slot: 'shoes', subject: 'sansu', level: 5 },
    { id: 'head_catears', name: 'ねこみみ カチューシャ', slot: 'head', subject: 'sansu', level: 6 },
    { id: 'clothes_rainbow', name: 'にじいろ ドレス', slot: 'clothes', subject: 'sansu', level: 7 },
    { id: 'acc_bag', name: 'ちいさな バッグ', slot: 'accessory', subject: 'sansu', level: 8 },
    { id: 'shoes_glass', name: 'ガラスの くつ', slot: 'shoes', subject: 'sansu', level: 9 },
    { id: 'head_tiara', name: 'プリンセスの ティアラ', slot: 'head', subject: 'sansu', level: 10 },

    { id: 'hair_long', name: 'ロング', slot: 'hair', subject: 'kokugo', level: 1 },
    { id: 'hair_twin', name: 'ツインテール', slot: 'hair', subject: 'kokugo', level: 2 },
    { id: 'pet_cat', name: 'ネコ', slot: 'pet', subject: 'kokugo', level: 3 },
    { id: 'bg_flower', name: 'おはなばたけ', slot: 'background', subject: 'kokugo', level: 4 },
    { id: 'hair_pony', name: 'ポニーテール', slot: 'hair', subject: 'kokugo', level: 5 },
    { id: 'pet_rabbit', name: 'ウサギ', slot: 'pet', subject: 'kokugo', level: 6 },
    { id: 'bg_sea', name: 'うみ', slot: 'background', subject: 'kokugo', level: 7 },
    { id: 'hair_bun', name: 'おだんご', slot: 'hair', subject: 'kokugo', level: 8 },
    { id: 'pet_dog', name: 'イヌ', slot: 'pet', subject: 'kokugo', level: 9 },
    { id: 'bg_castle', name: 'おしろ', slot: 'background', subject: 'kokugo', level: 10 }
  ];

  var DEFAULT_EQUIPPED = {
    head: 'head_ribbon',
    hair: 'hair_long',
    clothes: 'clothes_basic',
    shoes: 'shoes_pink',
    accessory: null,
    pet: null,
    background: null
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

  // 各教科のレベルから、持っているアイテムのIDを決める
  function ownedIds(levels) {
    return ITEMS.filter(function (item) { return item.level <= (levels[item.subject] || 1); })
      .map(function (item) { return item.id; });
  }

  // その教科で fromLevel より上、toLevel 以下で新しくもらえるアイテム
  function unlockedBetween(subject, fromLevel, toLevel) {
    return ITEMS.filter(function (item) {
      return item.subject === subject && item.level > fromLevel && item.level <= toLevel;
    });
  }

  var api = {
    SLOTS: SLOTS,
    SUBJECT_NAMES: SUBJECT_NAMES,
    ITEMS: ITEMS,
    DEFAULT_EQUIPPED: DEFAULT_EQUIPPED,
    getItem: getItem,
    itemsInSlot: itemsInSlot,
    ownedIds: ownedIds,
    unlockedBetween: unlockedBetween
  };

  root.Items = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
