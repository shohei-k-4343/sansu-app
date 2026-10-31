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

  // ---------- かみがた ----------

  var HAIR_LONG = '<path d="M50 84 C48 20 152 20 150 84 L154 150 Q100 166 46 150 Z" fill="' + HAIR + '"/>';
  var HAIR_SHORT = '<path d="M50 86 C48 20 152 20 150 86 Q150 112 140 120 L60 120 Q50 112 50 86 Z" fill="' + HAIR + '"/>';

  function hairTie(cx, cy) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#FF6FA8"/><circle cx="' + (cx - 2) + '" cy="' + (cy - 2) + '" r="1.8" fill="#fff"/>';
  }

  // back: 頭のうしろに描く部分 / front: 顔の前に描く部分（ヘアゴムなど）
  var HAIRS = {
    hair_long: { back: HAIR_LONG, front: '' },
    hair_twin: {
      back: HAIR_SHORT +
        '<path d="M58 56 C24 60 18 112 32 156 C44 132 52 100 62 72 Z" fill="' + HAIR + '"/>' +
        '<path d="M142 56 C176 60 182 112 168 156 C156 132 148 100 138 72 Z" fill="' + HAIR + '"/>',
      front: hairTie(56, 60) + hairTie(144, 60)
    },
    hair_pony: {
      back: HAIR_SHORT + '<path d="M136 46 C182 44 188 116 166 160 C160 124 150 94 128 68 Z" fill="' + HAIR + '"/>',
      front: hairTie(141, 52)
    },
    hair_bun: {
      back: HAIR_SHORT + '<circle cx="100" cy="30" r="19" fill="' + HAIR + '"/>' +
        '<path d="M90 22 Q98 16 106 20" stroke="#9A6A45" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
      front: '<path d="M84 44 Q100 36 116 44" stroke="#FF6FA8" stroke-width="5" fill="none" stroke-linecap="round"/>'
    }
  };

  function hair(id, part) {
    return (HAIRS[id] || HAIRS.hair_long)[part];
  }

  // ---------- からだ ----------

  function body() {
    return '' +
      '<rect x="84" y="210" width="12" height="54" rx="6" fill="' + SKIN + '"/>' +
      '<rect x="104" y="210" width="12" height="54" rx="6" fill="' + SKIN + '"/>' +
      '<path d="M77 150 L60 202" stroke="' + SKIN + '" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M123 150 L140 202" stroke="' + SKIN + '" stroke-width="12" stroke-linecap="round"/>' +
      '<rect x="93" y="118" width="14" height="22" fill="' + SKIN + '"/>';
  }

  function head() {
    return face() +
      // まえがみ
      '<path d="M53 84 C48 18 152 18 147 84 C140 66 126 56 112 58 C106 70 94 72 86 62 C74 66 62 72 53 84 Z" fill="' + HAIR + '"/>';
  }

  function face() {
    return '' +
      '<circle cx="100" cy="82" r="46" fill="' + SKIN + '"/>' +
      '<ellipse cx="83" cy="88" rx="5" ry="6.5" fill="#3B2A20"/>' +
      '<ellipse cx="117" cy="88" rx="5" ry="6.5" fill="#3B2A20"/>' +
      '<circle cx="85" cy="85.5" r="1.8" fill="#fff"/>' +
      '<circle cx="119" cy="85.5" r="1.8" fill="#fff"/>' +
      '<ellipse cx="73" cy="102" rx="7.5" ry="4.5" fill="#FFB3C1" opacity="0.75"/>' +
      '<ellipse cx="127" cy="102" rx="7.5" ry="4.5" fill="#FFB3C1" opacity="0.75"/>' +
      '<path d="M92 104 Q100 112 108 104" stroke="#D9536F" stroke-width="3" fill="none" stroke-linecap="round"/>';
  }

  // ---------- ペット（アバターの左下） ----------

  function petFace(eyeColor) {
    return '<circle cx="21" cy="255" r="2.2" fill="' + eyeColor + '"/><circle cx="31" cy="255" r="2.2" fill="' + eyeColor + '"/>' +
      '<ellipse cx="17" cy="261" rx="3" ry="1.8" fill="#FFB3C1" opacity="0.8"/><ellipse cx="35" cy="261" rx="3" ry="1.8" fill="#FFB3C1" opacity="0.8"/>';
  }

  var PETS = {
    pet_cat: function () {
      return '<path d="M48 284 Q64 266 54 248" stroke="#F0A050" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="34" cy="279" rx="17" ry="12" fill="#F6B26B"/>' +
        '<path d="M15 250 L14 233 L26 243 Z" fill="#F6B26B"/><path d="M37 250 L38 233 L26 243 Z" fill="#F6B26B"/>' +
        '<path d="M17 246 L17 238 L23 243 Z" fill="#FFC9DE"/><path d="M35 246 L35 238 L29 243 Z" fill="#FFC9DE"/>' +
        '<circle cx="26" cy="255" r="13" fill="#F6B26B"/>' +
        petFace('#3B2A20') +
        '<path d="M24 259 L28 259 L26 261.5 Z" fill="#E64980"/>' +
        '<path d="M10 258 L19 259 M10 262 L19 261 M42 258 L33 259 M42 262 L33 261" stroke="#C97A3A" stroke-width="1"/>';
    },
    pet_rabbit: function () {
      return '<ellipse cx="20" cy="232" rx="5.5" ry="15" fill="#fff" stroke="#EAD7E0" stroke-width="1.5"/>' +
        '<ellipse cx="32" cy="232" rx="5.5" ry="15" fill="#fff" stroke="#EAD7E0" stroke-width="1.5"/>' +
        '<ellipse cx="20" cy="233" rx="2.5" ry="10" fill="#FFC9DE"/><ellipse cx="32" cy="233" rx="2.5" ry="10" fill="#FFC9DE"/>' +
        '<ellipse cx="34" cy="279" rx="17" ry="12" fill="#fff" stroke="#EAD7E0" stroke-width="1.5"/>' +
        '<circle cx="51" cy="279" r="5" fill="#fff" stroke="#EAD7E0" stroke-width="1.5"/>' +
        '<circle cx="26" cy="256" r="13" fill="#fff" stroke="#EAD7E0" stroke-width="1.5"/>' +
        petFace('#E64980') +
        '<path d="M24 260 L28 260 L26 262 Z" fill="#FF8FAB"/>';
    },
    pet_dog: function () {
      return '<path d="M49 276 Q60 268 58 256" stroke="#B57A4A" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="34" cy="279" rx="17" ry="12" fill="#D9A06B"/>' +
        '<circle cx="26" cy="255" r="13" fill="#D9A06B"/>' +
        '<ellipse cx="13" cy="255" rx="5" ry="10" fill="#8B5A3C" transform="rotate(15 13 255)"/>' +
        '<ellipse cx="39" cy="255" rx="5" ry="10" fill="#8B5A3C" transform="rotate(-15 39 255)"/>' +
        '<ellipse cx="26" cy="262" rx="7" ry="5" fill="#F3D2B3"/>' +
        petFace('#3B2A20') +
        '<ellipse cx="26" cy="260" rx="2.6" ry="2" fill="#3B2A20"/>' +
        '<path d="M26 263 Q26 268 29 267" stroke="#FF6B8A" stroke-width="2" fill="none" stroke-linecap="round"/>';
    }
  };

  // ---------- はいけい ----------

  var BACKGROUNDS = {
    bg_flower: function () {
      var flowers = '';
      [[22, 236, '#FF8FAB'], [62, 256, '#FFD43B'], [150, 248, '#B197FC'], [182, 232, '#FF8FAB'], [120, 282, '#FFD43B'], [38, 286, '#B197FC'], [176, 280, '#FF6B6B']].forEach(function (f) {
        for (var i = 0; i < 5; i++) {
          var a = i * Math.PI * 2 / 5;
          flowers += '<circle cx="' + (f[0] + 5 * Math.cos(a)).toFixed(1) + '" cy="' + (f[1] + 5 * Math.sin(a)).toFixed(1) + '" r="4" fill="' + f[2] + '"/>';
        }
        flowers += '<circle cx="' + f[0] + '" cy="' + f[1] + '" r="2.8" fill="#FFF3BF"/>';
      });
      return '<rect width="200" height="300" rx="18" fill="#DDF3FF"/>' +
        '<circle cx="168" cy="40" r="18" fill="#FFE066"/>' +
        '<ellipse cx="40" cy="48" rx="22" ry="9" fill="#fff"/><ellipse cx="52" cy="42" rx="12" ry="9" fill="#fff"/>' +
        '<path d="M0 212 Q100 190 200 212 L200 282 Q200 300 182 300 L18 300 Q0 300 0 282 Z" fill="#B7E4A1"/>' +
        flowers;
    },
    bg_sea: function () {
      return '<rect width="200" height="300" rx="18" fill="#CDEBFF"/>' +
        '<circle cx="36" cy="44" r="16" fill="#FFE066"/>' +
        '<ellipse cx="150" cy="56" rx="24" ry="9" fill="#fff"/>' +
        '<rect x="0" y="160" width="200" height="80" fill="#6EC6F0"/>' +
        '<path d="M0 172 Q12 164 25 172 T50 172 T75 172 T100 172 T125 172 T150 172 T175 172 T200 172" stroke="#fff" stroke-width="3" fill="none"/>' +
        '<path d="M0 232 Q100 218 200 232 L200 282 Q200 300 182 300 L18 300 Q0 300 0 282 Z" fill="#F7E3B0"/>' +
        '<path d="M160 270 q6 -10 12 0 z" fill="#FF8FAB"/><circle cx="66" cy="284" r="4" fill="#fff"/>' +
        '<path d="' + starPath(180, 286, 7, 3) + '" fill="#FF922B"/>';
    },
    bg_castle: function () {
      var id = uid();
      var tower = function (x, w, top) {
        return '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + (230 - top) + '" fill="#E5D4FA"/>' +
          '<path d="M' + (x - 4) + ' ' + top + ' L' + (x + w / 2) + ' ' + (top - 30) + ' L' + (x + w + 4) + ' ' + top + ' Z" fill="#FF9EC7"/>' +
          '<rect x="' + (x + w / 2 - 4) + '" y="' + (top + 16) + '" width="8" height="12" rx="4" fill="#B197FC"/>';
      };
      return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#C9B6FF"/><stop offset="1" stop-color="#FFE0F0"/></linearGradient></defs>' +
        '<rect width="200" height="300" rx="18" fill="url(#' + id + ')"/>' +
        '<path d="' + starPath(30, 30, 5, 2) + '" fill="#fff"/><path d="' + starPath(172, 22, 4, 1.8) + '" fill="#fff"/>' +
        '<path d="' + starPath(100, 16, 3.5, 1.5) + '" fill="#fff"/>' +
        tower(8, 30, 110) + tower(162, 30, 110) + tower(40, 34, 80) + tower(126, 34, 80) +
        '<path d="M0 226 L200 226 L200 282 Q200 300 182 300 L18 300 Q0 300 0 282 Z" fill="#BFE6A8"/>';
    }
  };

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
    acc_bag: '110 134 58 86',
    pet_cat: '4 226 62 72',
    pet_rabbit: '4 214 62 84',
    pet_dog: '4 226 62 72',
    hair_long: '28 6 144 168',
    hair_twin: '12 6 176 168',
    hair_pony: '28 6 166 168',
    hair_bun: '28 2 144 168'
  };

  function drawItem(id) {
    if (draw[id]) return draw[id]();
    if (PETS[id]) return PETS[id]();
    if (BACKGROUNDS[id]) return BACKGROUNDS[id]();
    return '';
  }

  // 着ているアイテムを重ねてアバターを描く
  function renderAvatar(equipped) {
    var eq = equipped || {};
    return '<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="アバター">' +
      drawItem(eq.background) +
      hair(eq.hair, 'back') +
      body() +
      drawItem(eq.shoes) +
      drawItem(eq.clothes) +
      drawItem(eq.accessory) +
      head() +
      hair(eq.hair, 'front') +
      drawItem(eq.head) +
      drawItem(eq.pet) +
      '</svg>';
  }

  function renderItem(id) {
    // かみがたは、顔といっしょに見せる
    var content = HAIRS[id] ? hair(id, 'back') + head() + hair(id, 'front') : drawItem(id);
    return '<svg viewBox="' + (THUMB_BOX[id] || '0 0 200 300') + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      content + '</svg>';
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
