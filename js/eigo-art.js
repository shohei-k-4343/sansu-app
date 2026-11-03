// えいご：英単語の絵（SVG・100×100）
(function (root) {
  'use strict';

  var SKIN = '#FFE0C8';
  var LINE = '#5A3E4D';

  function starPath(cx, cy, outer, inner) {
    var d = '';
    for (var i = 0; i < 10; i++) {
      var r = i % 2 === 0 ? outer : inner;
      var a = -Math.PI / 2 + i * Math.PI / 5;
      d += (i === 0 ? 'M' : 'L') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1);
    }
    return d + 'Z';
  }

  function eyes(y, gap, r) {
    return '<circle cx="' + (50 - gap) + '" cy="' + y + '" r="' + r + '" fill="' + LINE + '"/>' +
      '<circle cx="' + (50 + gap) + '" cy="' + y + '" r="' + r + '" fill="' + LINE + '"/>';
  }

  // からだの絵：顔を描いて、その部分をピンクの輪で囲む
  function face(target) {
    var rings = {
      eye: '<circle cx="39" cy="52" r="10"/>',
      ear: '<circle cx="19" cy="56" r="11"/>',
      nose: '<circle cx="50" cy="61" r="8"/>',
      mouth: '<ellipse cx="50" cy="72" rx="13" ry="8"/>',
      hair: '<ellipse cx="50" cy="27" rx="34" ry="15"/>'
    };
    return '<ellipse cx="21" cy="56" rx="6" ry="9" fill="' + SKIN + '"/><ellipse cx="79" cy="56" rx="6" ry="9" fill="' + SKIN + '"/>' +
      '<circle cx="50" cy="54" r="29" fill="' + SKIN + '"/>' +
      '<path d="M21 52 C18 16 82 16 79 52 C72 36 58 32 50 34 C42 32 28 36 21 52Z" fill="#7A4B2A"/>' +
      '<ellipse cx="39" cy="52" rx="3.5" ry="4.5" fill="' + LINE + '"/><ellipse cx="61" cy="52" rx="3.5" ry="4.5" fill="' + LINE + '"/>' +
      '<path d="M50 56 Q46 64 51 64" stroke="#D99A7A" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M42 71 Q50 77 58 71" stroke="#D9536F" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<g fill="none" stroke="#FF4D8D" stroke-width="4" stroke-dasharray="6 4">' + rings[target] + '</g>';
  }

  // かずの絵：ほしを n 個ならべる
  function stars(n) {
    // 数が少ないときは大きく描く
    var rows = n <= 3 ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)];
    var size = n === 1 ? 34 : n === 2 ? 19 : n === 3 ? 13 : n === 4 ? 16 : 11;
    var gap = n === 1 ? 0 : n === 2 ? 44 : n === 3 ? 30 : n === 4 ? 38 : 23;
    var html = '';
    rows.forEach(function (count, r) {
      var y = rows.length === 1 ? 52 : 30 + r * 40;
      for (var i = 0; i < count; i++) {
        var x = 50 + (i - (count - 1) / 2) * gap;
        html += '<path d="' + starPath(x, y, size, size * 0.44) + '" fill="#FFD43B" stroke="#F59F00" stroke-width="1.5" stroke-linejoin="round"/>';
      }
    });
    return html;
  }

  // いろの絵：絵の具をぽたっと落としたかたち
  function paint(color, stroke) {
    return '<path d="M50 14 C66 14 70 26 78 30 C90 36 90 54 82 62 C78 66 82 76 74 82 C62 92 44 88 36 84 C22 80 12 68 16 54 C18 46 12 40 18 30 C24 20 38 14 50 14Z" fill="' + color + '"' +
      (stroke ? ' stroke="' + stroke + '" stroke-width="2.5"' : '') + '/>' +
      '<ellipse cx="38" cy="34" rx="8" ry="5" fill="#fff" opacity="0.45"/>';
  }

  var ART = {
    // ---------- たべもの ----------
    apple: '<path d="M50 30 C30 18 12 34 16 58 C20 82 38 92 50 86 C62 92 80 82 84 58 C88 34 70 18 50 30Z" fill="#FF4D4D"/>' +
      '<path d="M50 30 Q48 18 54 10" stroke="#7A4B2A" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M54 18 Q68 8 78 18 Q64 26 54 18Z" fill="#51CF66"/><ellipse cx="32" cy="46" rx="6" ry="10" fill="#fff" opacity="0.35"/>',
    banana: '<path d="M18 28 Q20 80 78 84 Q88 82 86 74 Q46 70 34 26 Q28 18 18 28Z" fill="#FFD43B" stroke="#E0A800" stroke-width="2.5"/>' +
      '<path d="M18 28 L22 18 L28 24Z" fill="#7A4B2A"/><path d="M30 34 Q38 62 66 72" stroke="#F0C000" stroke-width="2" fill="none"/>',
    grapes: (function () {
      var g = '<path d="M50 20 Q50 12 56 8" stroke="#7A4B2A" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path d="M52 16 Q66 6 74 16 Q62 22 52 16Z" fill="#51CF66"/>';
      [[38, 30], [52, 28], [66, 30], [32, 44], [46, 44], [60, 44], [74, 44], [40, 58], [54, 58], [68, 58], [47, 72], [61, 72], [54, 85]].forEach(function (p) {
        g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="8" fill="#9C6ADE" stroke="#7048B6" stroke-width="1.5"/>';
      });
      return g;
    })(),
    strawberry: '<path d="M50 28 C30 22 14 34 18 50 C22 68 40 88 50 92 C60 88 78 68 82 50 C86 34 70 22 50 28Z" fill="#FF4D6D"/>' +
      '<path d="M30 26 L42 30 L50 20 L58 30 L70 26 L64 36 L50 32 L36 36Z" fill="#40C057"/>' +
      '<g fill="#FFE066">' + [[36, 46], [50, 44], [64, 46], [42, 60], [58, 60], [50, 74], [32, 58], [68, 58]].map(function (p) {
        return '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="2" ry="3"/>';
      }).join('') + '</g>',
    cake: '<rect x="18" y="46" width="64" height="38" rx="6" fill="#FFC9DE"/>' +
      '<path d="M18 52 Q26 60 34 52 Q42 60 50 52 Q58 60 66 52 Q74 60 82 52 L82 44 L18 44Z" fill="#fff"/>' +
      '<rect x="18" y="64" width="64" height="6" fill="#FF8FAB"/>' +
      '<circle cx="50" cy="38" r="8" fill="#FF4D6D"/><path d="M46 31 L50 27 L54 31Z" fill="#40C057"/>' +
      '<rect x="66" y="20" width="5" height="22" rx="2" fill="#74C0FC"/><path d="M68.5 12 Q72 16 68.5 20 Q65 16 68.5 12Z" fill="#FFA94D"/>',
    egg: '<path d="M50 12 C30 12 18 44 18 62 C18 80 32 90 50 90 C68 90 82 80 82 62 C82 44 70 12 50 12Z" fill="#FFF8EE" stroke="#E2C9A6" stroke-width="3"/>' +
      '<ellipse cx="38" cy="40" rx="6" ry="10" fill="#fff"/>',
    milk: '<path d="M30 30 L70 30 L66 88 L34 88Z" fill="#fff" stroke="#A5D8FF" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M32 40 L68 40 L65 86 L35 86Z" fill="#F8F9FA"/>' +
      '<path d="M30 30 L70 30 L68 18 L32 18Z" fill="#74C0FC"/><text x="50" y="68" text-anchor="middle" font-size="12" font-family="Arial" font-weight="bold" fill="#339AF0">MILK</text>',
    bread: '<path d="M14 54 C14 30 30 22 50 22 C70 22 86 30 86 54 C86 62 80 64 78 64 L78 82 L22 82 L22 64 C20 64 14 62 14 54Z" fill="#E8A75D" stroke="#B9783A" stroke-width="2.5"/>' +
      '<path d="M24 60 L24 80 L76 80 L76 60 C80 58 82 54 80 46 C74 32 26 32 20 46 C18 54 20 58 24 60Z" fill="#FFE8C2"/>',

    // ---------- どうぶつ ----------
    dog: '<ellipse cx="22" cy="44" rx="10" ry="20" fill="#8B5A3C" transform="rotate(15 22 44)"/><ellipse cx="78" cy="44" rx="10" ry="20" fill="#8B5A3C" transform="rotate(-15 78 44)"/>' +
      '<circle cx="50" cy="52" r="28" fill="#D9A06B"/><ellipse cx="50" cy="66" rx="14" ry="10" fill="#F3D2B3"/>' +
      eyes(48, 11, 3.5) + '<ellipse cx="50" cy="60" rx="5" ry="4" fill="' + LINE + '"/>' +
      '<path d="M50 64 Q50 72 55 71" stroke="#FF6B8A" stroke-width="3" fill="none" stroke-linecap="round"/>',
    cat: '<path d="M24 40 L22 12 L44 28Z" fill="#F6B26B"/><path d="M76 40 L78 12 L56 28Z" fill="#F6B26B"/>' +
      '<path d="M27 34 L26 19 L38 28Z" fill="#FFC9DE"/><path d="M73 34 L74 19 L62 28Z" fill="#FFC9DE"/>' +
      '<circle cx="50" cy="54" r="28" fill="#F6B26B"/>' + eyes(50, 11, 3.5) +
      '<path d="M47 59 L53 59 L50 63Z" fill="#E64980"/>' +
      '<path d="M14 58 L36 60 M14 66 L36 64 M86 58 L64 60 M86 66 L64 64" stroke="#C97A3A" stroke-width="1.6"/>',
    rabbit: '<ellipse cx="38" cy="22" rx="8" ry="20" fill="#fff" stroke="#EAD7E0" stroke-width="2"/><ellipse cx="62" cy="22" rx="8" ry="20" fill="#fff" stroke="#EAD7E0" stroke-width="2"/>' +
      '<ellipse cx="38" cy="22" rx="3.5" ry="14" fill="#FFC9DE"/><ellipse cx="62" cy="22" rx="3.5" ry="14" fill="#FFC9DE"/>' +
      '<circle cx="50" cy="60" r="26" fill="#fff" stroke="#EAD7E0" stroke-width="2"/>' + eyes(56, 10, 3.5) +
      '<path d="M47 63 L53 63 L50 66Z" fill="#FF8FAB"/><path d="M50 66 L50 70 M50 70 Q46 73 43 70 M50 70 Q54 73 57 70" stroke="#C9A3B5" stroke-width="1.6" fill="none"/>',
    bird: '<ellipse cx="48" cy="56" rx="30" ry="24" fill="#FFD43B"/><circle cx="64" cy="40" r="16" fill="#FFD43B"/>' +
      '<path d="M78 40 L92 44 L78 48Z" fill="#FF922B"/><circle cx="68" cy="37" r="3" fill="' + LINE + '"/>' +
      '<path d="M30 52 Q44 46 52 60 Q40 70 30 52Z" fill="#FAB005"/><path d="M18 56 L6 48 L10 62Z" fill="#FAB005"/>' +
      '<path d="M44 80 L42 90 M54 80 L56 90" stroke="#FF922B" stroke-width="3" stroke-linecap="round"/>',
    fish: '<path d="M14 50 C26 26 66 22 80 50 C66 78 26 74 14 50Z" fill="#4DABF7"/>' +
      '<path d="M78 50 L96 34 L94 66Z" fill="#339AF0"/><circle cx="30" cy="46" r="4.5" fill="#fff"/><circle cx="30" cy="46" r="2.5" fill="' + LINE + '"/>' +
      '<path d="M46 34 Q54 50 46 66 M58 34 Q66 50 58 66" stroke="#A5D8FF" stroke-width="2.5" fill="none"/>',
    bear: '<circle cx="26" cy="28" r="11" fill="#9C6644"/><circle cx="74" cy="28" r="11" fill="#9C6644"/>' +
      '<circle cx="26" cy="28" r="5" fill="#D9A06B"/><circle cx="74" cy="28" r="5" fill="#D9A06B"/>' +
      '<circle cx="50" cy="54" r="30" fill="#9C6644"/><ellipse cx="50" cy="66" rx="14" ry="11" fill="#D9A06B"/>' +
      eyes(48, 12, 3.5) + '<ellipse cx="50" cy="61" rx="5" ry="3.5" fill="' + LINE + '"/>' +
      '<path d="M45 69 Q50 73 55 69" stroke="' + LINE + '" stroke-width="2" fill="none" stroke-linecap="round"/>',
    pig: '<path d="M24 36 L20 14 L42 28Z" fill="#FFA8C5"/><path d="M76 36 L80 14 L58 28Z" fill="#FFA8C5"/>' +
      '<circle cx="50" cy="54" r="30" fill="#FFC2D6"/>' + eyes(46, 13, 3.5) +
      '<ellipse cx="50" cy="62" rx="13" ry="9" fill="#FF99BB"/><ellipse cx="45" cy="62" rx="2.5" ry="3.5" fill="#C2255C"/><ellipse cx="55" cy="62" rx="2.5" ry="3.5" fill="#C2255C"/>',
    frog: '<circle cx="32" cy="32" r="13" fill="#69DB7C"/><circle cx="68" cy="32" r="13" fill="#69DB7C"/>' +
      '<ellipse cx="50" cy="60" rx="36" ry="26" fill="#69DB7C"/>' +
      '<circle cx="32" cy="31" r="7" fill="#fff"/><circle cx="68" cy="31" r="7" fill="#fff"/>' +
      '<circle cx="33" cy="32" r="3.5" fill="' + LINE + '"/><circle cx="67" cy="32" r="3.5" fill="' + LINE + '"/>' +
      '<path d="M30 64 Q50 78 70 64" stroke="#2B8A3E" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="24" cy="60" rx="5" ry="3" fill="#FFB3C1"/><ellipse cx="76" cy="60" rx="5" ry="3" fill="#FFB3C1"/>',

    // ---------- いろ ----------
    red: paint('#FF3B3B'),
    blue: paint('#339AF0'),
    yellow: paint('#FFD43B'),
    green: paint('#40C057'),
    pink: paint('#FF8FC7'),
    white: paint('#FFFFFF', '#C9C2C6'),
    black: paint('#222222'),
    orange: paint('#FF922B'),

    // ---------- かず ----------
    one: stars(1), two: stars(2), three: stars(3), four: stars(4),
    five: stars(5), six: stars(6), seven: stars(7), eight: stars(8),

    // ---------- からだ ----------
    eye: face('eye'),
    ear: face('ear'),
    nose: face('nose'),
    mouth: face('mouth'),
    hair: face('hair'),
    hand: '<path d="M34 90 L32 60 C30 52 20 46 18 40 C16 34 22 32 26 36 L34 46 L32 18 C32 12 40 12 40 18 L42 40 L44 12 C44 6 52 6 52 12 L54 40 L58 16 C58 10 66 10 66 16 L64 42 L70 24 C72 18 80 20 78 26 L72 56 C70 70 68 80 66 90Z" fill="' + SKIN + '" stroke="#D99A7A" stroke-width="2.5" stroke-linejoin="round"/>',
    foot: '<path d="M38 40 C30 52 30 70 34 82 C38 92 56 94 60 84 C64 74 58 62 62 50 C66 38 58 30 50 30 C44 30 40 34 38 40Z" fill="' + SKIN + '" stroke="#D99A7A" stroke-width="2.5"/>' +
      [[38, 22, 6], [50, 16, 6.5], [61, 18, 5.5], [69, 25, 4.8], [74, 34, 4.2]].map(function (t) {
        return '<circle cx="' + t[0] + '" cy="' + t[1] + '" r="' + t[2] + '" fill="' + SKIN + '" stroke="#D99A7A" stroke-width="2.5"/>';
      }).join(''),
    tooth: '<path d="M26 22 C34 14 44 18 50 22 C56 18 66 14 74 22 C82 30 78 48 74 58 C70 70 70 88 62 88 C56 88 56 66 50 66 C44 66 44 88 38 88 C30 88 30 70 26 58 C22 48 18 30 26 22Z" fill="#fff" stroke="#A5D8FF" stroke-width="3"/>' +
      '<ellipse cx="36" cy="34" rx="5" ry="8" fill="#E7F5FF"/>' + eyes(44, 9, 3) + '<path d="M45 52 Q50 56 55 52" stroke="' + LINE + '" stroke-width="2" fill="none" stroke-linecap="round"/>',

    // ---------- のりもの・もの ----------
    car: '<path d="M10 66 L14 50 C16 46 22 44 26 44 L32 30 C34 26 38 24 42 24 L62 24 C66 24 70 26 72 30 L80 44 C86 44 90 48 90 54 L90 66Z" fill="#FF4D4D"/>' +
      '<path d="M36 44 L41 31 L50 31 L50 44Z M55 44 L55 31 L64 31 L71 44Z" fill="#D0EBFF"/>' +
      '<circle cx="30" cy="68" r="10" fill="#343A40"/><circle cx="30" cy="68" r="4" fill="#ADB5BD"/>' +
      '<circle cx="72" cy="68" r="10" fill="#343A40"/><circle cx="72" cy="68" r="4" fill="#ADB5BD"/>' +
      '<rect x="84" y="52" width="6" height="5" rx="2" fill="#FFE066"/>',
    bus: '<rect x="8" y="24" width="84" height="48" rx="10" fill="#FCC419"/>' +
      '<g fill="#D0EBFF"><rect x="16" y="32" width="14" height="14" rx="3"/><rect x="34" y="32" width="14" height="14" rx="3"/><rect x="52" y="32" width="14" height="14" rx="3"/><rect x="72" y="32" width="14" height="22" rx="3"/></g>' +
      '<rect x="8" y="56" width="84" height="5" fill="#F08C00"/>' +
      '<circle cx="28" cy="74" r="9" fill="#343A40"/><circle cx="28" cy="74" r="3.5" fill="#ADB5BD"/>' +
      '<circle cx="74" cy="74" r="9" fill="#343A40"/><circle cx="74" cy="74" r="3.5" fill="#ADB5BD"/>',
    train: '<rect x="20" y="16" width="60" height="58" rx="14" fill="#40C057"/>' +
      '<rect x="28" y="24" width="44" height="22" rx="5" fill="#D0EBFF"/>' +
      '<circle cx="34" cy="60" r="5" fill="#FFE066"/><circle cx="66" cy="60" r="5" fill="#FFE066"/>' +
      '<rect x="40" y="56" width="20" height="8" rx="3" fill="#2B8A3E"/>' +
      '<path d="M28 74 L18 90 M72 74 L82 90" stroke="#868E96" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M10 90 L90 90" stroke="#868E96" stroke-width="4" stroke-linecap="round"/>',
    boat: '<path d="M50 14 L50 64" stroke="#7A4B2A" stroke-width="3.5"/>' +
      '<path d="M53 16 L82 58 L53 58Z" fill="#fff" stroke="#DEE2E6" stroke-width="2"/><path d="M47 24 L24 58 L47 58Z" fill="#FF8FAB"/>' +
      '<path d="M14 64 L86 64 L74 82 L26 82Z" fill="#E8590C"/>' +
      '<path d="M4 88 Q16 82 28 88 T52 88 T76 88 T100 88" stroke="#74C0FC" stroke-width="4" fill="none"/>',
    airplane: '<path d="M10 52 C10 44 20 42 30 42 L78 42 C88 42 94 46 94 50 C94 54 88 58 78 58 L30 58 C20 58 10 58 10 52Z" fill="#E7F5FF" stroke="#74C0FC" stroke-width="2.5"/>' +
      '<path d="M44 48 L56 48 L40 84 L32 84Z" fill="#339AF0"/><path d="M44 50 L56 50 L40 18 L32 18Z" fill="#4DABF7"/>' +
      '<path d="M14 50 L8 32 L20 32 L26 44Z" fill="#339AF0"/>' +
      '<g fill="#74C0FC"><circle cx="66" cy="50" r="3"/><circle cx="74" cy="50" r="3"/><circle cx="58" cy="50" r="3"/></g>',
    bicycle: '<circle cx="24" cy="64" r="16" fill="none" stroke="#343A40" stroke-width="4"/><circle cx="76" cy="64" r="16" fill="none" stroke="#343A40" stroke-width="4"/>' +
      '<path d="M24 64 L42 40 L66 40 L76 64 M42 40 L52 64 L66 40 M52 64 L24 64" stroke="#FF6B8A" stroke-width="4" fill="none" stroke-linejoin="round"/>' +
      '<path d="M40 36 L48 36 M66 40 L62 28 L70 26" stroke="#343A40" stroke-width="4" fill="none" stroke-linecap="round"/>',
    ball: '<circle cx="50" cy="52" r="34" fill="#fff" stroke="#DEE2E6" stroke-width="2"/>' +
      '<path d="M50 18 C36 30 36 74 50 86 C64 74 64 30 50 18Z" fill="#FF6B6B"/>' +
      '<path d="M16 52 C30 40 70 40 84 52 C70 64 30 64 16 52Z" fill="#4DABF7" opacity="0.85"/>' +
      '<circle cx="50" cy="52" r="34" fill="none" stroke="#ADB5BD" stroke-width="2"/>',
    book: '<path d="M50 26 C40 20 22 18 10 22 L10 80 C22 76 40 78 50 84Z" fill="#fff" stroke="#74C0FC" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M50 26 C60 20 78 18 90 22 L90 80 C78 76 60 78 50 84Z" fill="#fff" stroke="#74C0FC" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M18 36 L42 38 M18 46 L42 48 M18 56 L42 58 M58 38 L82 36 M58 48 L82 46 M58 58 L82 56" stroke="#CED4DA" stroke-width="2.5" stroke-linecap="round"/>',

    // ---------- しぜん ----------
    sun: (function () {
      var rays = '';
      for (var i = 0; i < 12; i++) {
        var a = i * Math.PI / 6;
        rays += '<path d="M' + (50 + 30 * Math.cos(a)).toFixed(1) + ' ' + (50 + 30 * Math.sin(a)).toFixed(1) + ' L' + (50 + 42 * Math.cos(a)).toFixed(1) + ' ' + (50 + 42 * Math.sin(a)).toFixed(1) + '"/>';
      }
      return '<g stroke="#FAB005" stroke-width="5" stroke-linecap="round">' + rays + '</g><circle cx="50" cy="50" r="24" fill="#FFD43B"/>';
    })(),
    moon: '<path d="M62 12 C40 14 24 32 24 52 C24 74 42 90 64 90 C72 90 80 88 86 82 C64 84 46 68 46 48 C46 32 54 18 62 12Z" fill="#FFE066" stroke="#FAB005" stroke-width="2.5"/>',
    star: '<path d="' + starPath(50, 54, 40, 17) + '" fill="#FFD43B" stroke="#F59F00" stroke-width="3" stroke-linejoin="round"/>',
    cloud: '<path d="M24 74 C10 74 8 54 22 50 C20 36 38 30 46 38 C50 24 72 24 74 40 C90 38 94 60 82 66 C82 72 78 74 72 74Z" fill="#fff" stroke="#A5D8FF" stroke-width="3"/>',
    rain: '<path d="M24 54 C10 54 8 34 22 30 C20 16 38 10 46 18 C50 4 72 4 74 20 C90 18 94 40 82 46 C82 52 78 54 72 54Z" fill="#E9ECEF" stroke="#ADB5BD" stroke-width="2.5"/>' +
      '<g fill="#4DABF7">' + [[28, 66], [48, 72], [68, 66], [38, 86], [58, 88]].map(function (p) {
        return '<path d="M' + p[0] + ' ' + (p[1] - 8) + ' C' + (p[0] + 5) + ' ' + p[1] + ' ' + (p[0] + 5) + ' ' + (p[1] + 5) + ' ' + p[0] + ' ' + (p[1] + 5) + ' C' + (p[0] - 5) + ' ' + (p[1] + 5) + ' ' + (p[0] - 5) + ' ' + p[1] + ' ' + p[0] + ' ' + (p[1] - 8) + 'Z"/>';
      }).join('') + '</g>',
    tree: '<rect x="43" y="56" width="14" height="34" rx="3" fill="#8B5A3C"/>' +
      '<circle cx="50" cy="38" r="24" fill="#51CF66"/><circle cx="32" cy="52" r="16" fill="#40C057"/><circle cx="68" cy="52" r="16" fill="#40C057"/>' +
      '<circle cx="40" cy="34" r="3.5" fill="#FF6B6B"/><circle cx="60" cy="44" r="3.5" fill="#FF6B6B"/>',
    flower: (function () {
      var p = '<path d="M50 56 L50 92" stroke="#40C057" stroke-width="5" stroke-linecap="round"/><path d="M50 78 Q62 66 72 72 Q62 84 50 78Z" fill="#51CF66"/>';
      for (var i = 0; i < 6; i++) {
        var a = i * Math.PI / 3;
        p += '<circle cx="' + (50 + 15 * Math.cos(a)).toFixed(1) + '" cy="' + (38 + 15 * Math.sin(a)).toFixed(1) + '" r="11" fill="#FF8FC7"/>';
      }
      return p + '<circle cx="50" cy="38" r="9" fill="#FFD43B"/>';
    })(),
    rainbow: ['#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#4DABF7', '#9775FA'].map(function (c, i) {
      var r = 42 - i * 6;
      return '<path d="M' + (50 - r) + ' 76 A' + r + ' ' + r + ' 0 0 1 ' + (50 + r) + ' 76" stroke="' + c + '" stroke-width="6" fill="none"/>';
    }).join('') + '<ellipse cx="14" cy="78" rx="12" ry="7" fill="#fff" stroke="#DEE2E6" stroke-width="2"/><ellipse cx="86" cy="78" rx="12" ry="7" fill="#fff" stroke="#DEE2E6" stroke-width="2"/>'
  };

  function word(id) {
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + (ART[id] || '') + '</svg>';
  }

  root.EigoArt = {
    word: word,
    has: function (id) { return Object.prototype.hasOwnProperty.call(ART, id); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
