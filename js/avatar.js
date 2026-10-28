// アバターとアイテムの絵（SVG）
// 絵はすべて 200×300 の同じ座標で描き、アイテムは重ねるだけで着せ替えられるようにする
(function (root) {
  'use strict';

  var SKIN = '#FFE0C8';
  var HAIR = '#7A4B2A';
  var DRESS_PATH = 'M80 140 Q100 132 120 140 L128 180 L148 222 Q100 234 52 222 L72 180 Z';

  // 同じ画面に何度も描くので、模様（グラデーションなど）の名前が重ならないよう番号をつける
  var uidCounter = 0;
  function uid() {
    uidCounter += 1;
    return 'av' + uidCounter;
  }

  function starPath(cx, cy, outer, inner) {
    var d = '';
    for (var i = 0; i < 10; i++) {
      var r = i % 2 === 0 ? outer : inner;
      var angle = -Math.PI / 2 + i * Math.PI / 5;
      d += (i === 0 ? 'M' : 'L') + (cx + r * Math.cos(angle)).toFixed(1) + ' ' + (cy + r * Math.sin(angle)).toFixed(1);
    }
    return d + 'Z';
  }

  function heartPath(cx, cy, s) {
    return 'M' + cx + ' ' + (cy + s) +
      ' C' + (cx - s * 1.6) + ' ' + (cy - s * 0.2) + ' ' + (cx - s * 0.8) + ' ' + (cy - s * 1.3) + ' ' + cx + ' ' + (cy - s * 0.5) +
      ' C' + (cx + s * 0.8) + ' ' + (cy - s * 1.3) + ' ' + (cx + s * 1.6) + ' ' + (cy - s * 0.2) + ' ' + cx + ' ' + (cy + s) + 'Z';
  }

  // ---------- からだ ----------

  function hairBack() {
    return '<path d="M50 84 C48 20 152 20 150 84 L154 150 Q100 166 46 150 Z" fill="' + HAIR + '"/>';
  }

  function body() {
    return '' +
      '<rect x="84" y="210" width="12" height="54" rx="6" fill="' + SKIN + '"/>' +
      '<rect x="104" y="210" width="12" height="54" rx="6" fill="' + SKIN + '"/>' +
      '<path d="M77 150 L60 202" stroke="' + SKIN + '" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M123 150 L140 202" stroke="' + SKIN + '" stroke-width="12" stroke-linecap="round"/>' +
      '<rect x="93" y="118" width="14" height="22" fill="' + SKIN + '"/>';
  }

  function head() {
    return '' +
      '<circle cx="100" cy="82" r="46" fill="' + SKIN + '"/>' +
      '<ellipse cx="83" cy="88" rx="5" ry="6.5" fill="#3B2A20"/>' +
      '<ellipse cx="117" cy="88" rx="5" ry="6.5" fill="#3B2A20"/>' +
      '<circle cx="85" cy="85.5" r="1.8" fill="#fff"/>' +
      '<circle cx="119" cy="85.5" r="1.8" fill="#fff"/>' +
      '<ellipse cx="73" cy="102" rx="7.5" ry="4.5" fill="#FFB3C1" opacity="0.75"/>' +
      '<ellipse cx="127" cy="102" rx="7.5" ry="4.5" fill="#FFB3C1" opacity="0.75"/>' +
      '<path d="M92 104 Q100 112 108 104" stroke="#D9536F" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      // まえがみ
      '<path d="M53 84 C48 18 152 18 147 84 C140 66 126 56 112 58 C106 70 94 72 86 62 C74 66 62 72 53 84 Z" fill="' + HAIR + '"/>';
  }

  // ---------- ふく ----------

  function dress(fill, extra, stroke) {
    return '' +
      '<ellipse cx="76" cy="148" rx="11" ry="10" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="2"' : '') + '/>' +
      '<ellipse cx="124" cy="148" rx="11" ry="10" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="2"' : '') + '/>' +
      '<path d="' + DRESS_PATH + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="2"' : '') + '/>' +
      (extra || '');
  }

  var draw = {
    clothes_basic: function () {
      return dress('#F9A8C9',
        '<path d="M88 138 Q100 150 112 138" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path d="M58 216 Q100 228 142 216" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="6 5"/>');
    },
    clothes_dots: function () {
      var id = uid();
      var dots = '';
      for (var y = 146; y <= 230; y += 16) {
        for (var x = 50 + ((y / 16) % 2) * 8; x <= 150; x += 16) {
          dots += '<circle cx="' + x + '" cy="' + y + '" r="3.6" fill="#fff"/>';
        }
      }
      return '<defs><clipPath id="' + id + '"><path d="' + DRESS_PATH + '"/></clipPath></defs>' +
        dress('#8FD0F5',
          '<g clip-path="url(#' + id + ')">' + dots + '</g>' +
          '<path d="M72 180 Q100 188 128 180" stroke="#FF8FB8" stroke-width="5" fill="none"/>' +
          '<circle cx="100" cy="186" r="5" fill="#FF8FB8"/>');
    },
    clothes_rainbow: function () {
      var id = uid();
      return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#FF9AA2"/><stop offset="0.25" stop-color="#FFC8A2"/>' +
        '<stop offset="0.5" stop-color="#FFF1A6"/><stop offset="0.75" stop-color="#B5EAD7"/>' +
        '<stop offset="1" stop-color="#C7CEEA"/></linearGradient></defs>' +
        dress('url(#' + id + ')',
          '<path d="' + starPath(78, 206, 5, 2.2) + '" fill="#fff"/>' +
          '<path d="' + starPath(118, 214, 4, 1.8) + '" fill="#fff"/>' +
          '<path d="' + starPath(100, 160, 4, 1.8) + '" fill="#fff"/>' +
          '<path d="M72 180 Q100 188 128 180" stroke="#B197FC" stroke-width="5" fill="none"/>', '#fff');
    },

    // ---------- くつ ----------
    shoes_pink: function () {
      return '<ellipse cx="88" cy="265" rx="13" ry="7" fill="#F472B6"/>' +
        '<ellipse cx="112" cy="265" rx="13" ry="7" fill="#F472B6"/>' +
        '<circle cx="90" cy="261" r="2.5" fill="#fff"/><circle cx="110" cy="261" r="2.5" fill="#fff"/>';
    },
    shoes_sparkle: function () {
      return '<ellipse cx="88" cy="265" rx="13" ry="7" fill="#FCC419"/>' +
        '<ellipse cx="112" cy="265" rx="13" ry="7" fill="#FCC419"/>' +
        '<path d="' + starPath(88, 263, 4.5, 2) + '" fill="#fff"/>' +
        '<path d="' + starPath(112, 263, 4.5, 2) + '" fill="#fff"/>' +
        '<path d="' + starPath(74, 254, 3, 1.2) + '" fill="#FFD43B"/>' +
        '<path d="' + starPath(127, 254, 3, 1.2) + '" fill="#FFD43B"/>';
    },
    shoes_glass: function () {
      return '<ellipse cx="88" cy="265" rx="13" ry="7" fill="#D3F4FF" fill-opacity="0.9" stroke="#74C0FC" stroke-width="2"/>' +
        '<ellipse cx="112" cy="265" rx="13" ry="7" fill="#D3F4FF" fill-opacity="0.9" stroke="#74C0FC" stroke-width="2"/>' +
        '<path d="M80 263 Q86 259 92 261" stroke="#fff" stroke-width="2" fill="none"/>' +
        '<path d="M104 263 Q110 259 116 261" stroke="#fff" stroke-width="2" fill="none"/>';
    },

    // ---------- あたま ----------
    head_ribbon: function () {
      return '<path d="M126 44 L104 32 L106 58 Z" fill="#FF5C93"/>' +
        '<path d="M126 44 L148 32 L146 58 Z" fill="#FF5C93"/>' +
        '<circle cx="126" cy="44" r="6.5" fill="#E64980"/>';
    },
    head_starpin: function () {
      return '<path d="' + starPath(124, 50, 13, 6) + '" fill="#FFD43B" stroke="#F59F00" stroke-width="2" stroke-linejoin="round"/>' +
        '<circle cx="120" cy="47" r="2" fill="#fff"/>';
    },
    head_catears: function () {
      return '<path d="M60 64 Q100 20 140 64" stroke="#B197FC" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<path d="M66 52 L60 18 L92 38 Z" fill="#B197FC"/>' +
        '<path d="M134 52 L140 18 L108 38 Z" fill="#B197FC"/>' +
        '<path d="M70 46 L67 28 L84 39 Z" fill="#FFC9DE"/>' +
        '<path d="M130 46 L133 28 L116 39 Z" fill="#FFC9DE"/>';
    },
    head_tiara: function () {
      return '<path d="M70 46 L78 22 L90 38 L100 12 L110 38 L122 22 L130 46 Q100 38 70 46 Z" fill="#FFD43B" stroke="#F08C00" stroke-width="2" stroke-linejoin="round"/>' +
        '<circle cx="100" cy="32" r="5" fill="#FF6B9A"/>' +
        '<circle cx="80" cy="36" r="3.5" fill="#74C0FC"/>' +
        '<circle cx="120" cy="36" r="3.5" fill="#74C0FC"/>' +
        '<circle cx="100" cy="12" r="3" fill="#fff" stroke="#F08C00" stroke-width="1.5"/>';
    },

    // ---------- アクセサリー ----------
    acc_heart: function () {
      return '<path d="M88 137 Q100 152 112 137" stroke="#F59F00" stroke-width="2" fill="none"/>' +
        '<path d="' + heartPath(100, 153, 6) + '" fill="#FF4D6D" stroke="#fff" stroke-width="1.5"/>';
    },
    acc_bag: function () {
      return '<path d="M116 140 L146 194" stroke="#C2703D" stroke-width="3.5" stroke-linecap="round"/>' +
        '<rect x="134" y="190" width="28" height="24" rx="7" fill="#FF8FAB" stroke="#E64980" stroke-width="2"/>' +
        '<path d="M134 198 Q148 208 162 198" fill="#FFB3C6" stroke="#E64980" stroke-width="2"/>' +
        '<path d="' + heartPath(148, 206, 3) + '" fill="#fff"/>';
    }
  };

  // アイテム1個だけを見せるときの表示範囲（viewBox）
  var THUMB_BOX = {
    head_ribbon: '98 24 56 44',
    head_starpin: '106 32 36 36',
    head_catears: '50 10 100 64',
    head_tiara: '62 4 76 50',
    clothes_basic: '44 128 112 112',
    clothes_dots: '44 128 112 112',
    clothes_rainbow: '44 128 112 112',
    shoes_pink: '66 236 68 52',
    shoes_sparkle: '66 236 68 52',
    shoes_glass: '66 236 68 52',
    acc_heart: '80 128 40 40',
    acc_bag: '110 134 58 86'
  };

  function drawItem(id) {
    return draw[id] ? draw[id]() : '';
  }

  // 着ているアイテムを重ねてアバターを描く
  function renderAvatar(equipped) {
    var eq = equipped || {};
    return '<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="アバター">' +
      hairBack() +
      body() +
      drawItem(eq.shoes) +
      drawItem(eq.clothes) +
      drawItem(eq.accessory) +
      head() +
      drawItem(eq.head) +
      '</svg>';
  }

  function renderItem(id) {
    return '<svg viewBox="' + (THUMB_BOX[id] || '0 0 200 300') + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      drawItem(id) + '</svg>';
  }

  function renderStar(filled) {
    return '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="' + starPath(20, 21, 18, 8) + '" fill="' +
      (filled ? '#FFD43B' : '#fff') + '" stroke="' + (filled ? '#F59F00' : '#F3D3E3') +
      '" stroke-width="2.5" stroke-linejoin="round"/></svg>';
  }

  // せいかいのときの はなまる
  function renderHanamaru() {
    var petals = '';
    for (var i = 0; i < 8; i++) {
      var angle = i * Math.PI / 4;
      var cx = (60 + 44 * Math.cos(angle)).toFixed(1);
      var cy = (60 + 44 * Math.sin(angle)).toFixed(1);
      petals += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="13" ry="9" transform="rotate(' + (i * 45) + ' ' + cx + ' ' + cy + ')" fill="none" stroke="#FF4D6D" stroke-width="4"/>';
    }
    return '<svg viewBox="0 0 120 120" aria-hidden="true">' + petals +
      '<path d="M60 26 A34 34 0 1 1 59.9 26 M60 40 A20 20 0 1 1 59.9 40 M60 52 A8 8 0 1 1 59.9 52" fill="none" stroke="#FF4D6D" stroke-width="5" stroke-linecap="round"/></svg>';
  }

  // おしい・じかんぎれのときの やさしい顔
  function renderSoftFace() {
    return '<svg viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle cx="60" cy="60" r="46" fill="#FFF3BF" stroke="#FCC419" stroke-width="4"/>' +
      '<circle cx="44" cy="54" r="5" fill="#5A3E4D"/><circle cx="76" cy="54" r="5" fill="#5A3E4D"/>' +
      '<path d="M44 76 Q60 88 76 76" stroke="#5A3E4D" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="34" cy="70" rx="7" ry="4" fill="#FFB3C1"/><ellipse cx="86" cy="70" rx="7" ry="4" fill="#FFB3C1"/>' +
      '</svg>';
  }

  root.Avatar = {
    renderAvatar: renderAvatar,
    renderItem: renderItem,
    renderStar: renderStar,
    renderHanamaru: renderHanamaru,
    renderSoftFace: renderSoftFace
  };
})(typeof window !== 'undefined' ? window : globalThis);
