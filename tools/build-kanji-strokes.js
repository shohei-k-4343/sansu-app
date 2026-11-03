// KanjiVG から80字ぶんの書き順データを取り出して js/kanji-strokes.js を作る
// 実行方法: node tools/build-kanji-strokes.js
// （インターネットにつながっている必要があります。アプリを遊ぶときには不要です）
'use strict';

const fs = require('fs');
const path = require('path');
const Kanji = require('../js/kanji.js');

const BASE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/';
const OUT = path.join(__dirname, '..', 'js', 'kanji-strokes.js');

function fileName(ch) {
  return ch.codePointAt(0).toString(16).padStart(5, '0') + '.svg';
}

// SVG から、書き順どおりに並んだ線（path の d）だけを取り出す
function extractStrokes(svg, ch) {
  const strokes = [];
  const re = /<path[^>]*\bid="kvg:[0-9a-f]+-s(\d+)"[^>]*\bd="([^"]+)"/g;
  let m;
  while ((m = re.exec(svg)) !== null) {
    strokes.push({ n: Number(m[1]), d: m[2].replace(/\s+/g, ' ').trim() });
  }
  // 属性の順番が d → id のこともあるので、そちらも探す
  const re2 = /<path[^>]*\bd="([^"]+)"[^>]*\bid="kvg:[0-9a-f]+-s(\d+)"/g;
  while ((m = re2.exec(svg)) !== null) {
    if (!strokes.some((s) => s.n === Number(m[2]))) strokes.push({ n: Number(m[2]), d: m[1].replace(/\s+/g, ' ').trim() });
  }
  strokes.sort((a, b) => a.n - b.n);
  if (strokes.length === 0) throw new Error(ch + ' の線が見つかりません');
  strokes.forEach((s, i) => {
    if (s.n !== i + 1) throw new Error(ch + ' の書き順の番号が飛んでいます');
  });
  return strokes.map((s) => s.d);
}

async function main() {
  const result = {};
  for (const k of Kanji.ALL) {
    const url = BASE + fileName(k.kanji);
    const res = await fetch(url);
    if (!res.ok) throw new Error(k.kanji + ' を取得できません: ' + res.status);
    result[k.kanji] = extractStrokes(await res.text(), k.kanji);
    process.stdout.write(k.kanji + '(' + result[k.kanji].length + ') ');
  }

  const lines = Object.keys(result).map((ch) => '    ' + JSON.stringify(ch) + ': ' + JSON.stringify(result[ch]));
  const js = `// 書き順データ（自動生成：tools/build-kanji-strokes.js）
// KanjiVG (c) Ulrich Apel - https://kanjivg.tagaini.net
// このファイルは Creative Commons Attribution-Share Alike 3.0 ライセンス（CC BY-SA 3.0）で提供されます。
// https://creativecommons.org/licenses/by-sa/3.0/
// 座標は 109×109 の枠の中。配列の順番が書き順。
(function (root) {
  'use strict';

  var STROKES = {
${lines.join(',\n')}
  };

  root.KanjiStrokes = STROKES;
  if (typeof module !== 'undefined' && module.exports) module.exports = STROKES;
})(typeof window !== 'undefined' ? window : globalThis);
`;
  fs.writeFileSync(OUT, js);
  console.log('\n作成: ' + OUT);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
