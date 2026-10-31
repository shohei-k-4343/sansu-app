// こくご：漢字を指でなぞるしくみ（SPEC.md 14-3「なぞり」）
// 書き順データ（KanjiVG）の線を1本ずつ光らせ、子どもがなぞった線と比べて判定する
(function (root) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var SAMPLES = 24;            // 線を比べるときに取る点の数
  var MAX_END_DIST = 24;       // 書きはじめ・書きおわりのずれの許容（枠は 109×109）
  var MAX_MEAN_DIST = 17;      // 線全体の平均のずれの許容
  var MIN_DRAW_LENGTH = 5;     // これより短いのは「タッチしただけ」として無視
  var MAX_FAILS = 3;           // 同じ線でこの回数まちがえたら、お手本を自動で書く

  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function dist(p, q) {
    return Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y));
  }

  function polylineLength(points) {
    var len = 0;
    for (var i = 1; i < points.length; i++) len += dist(points[i - 1], points[i]);
    return len;
  }

  // なぞった点の列を、長さにそって等間隔に n 点取り直す
  function resample(points, n) {
    var total = polylineLength(points);
    if (points.length < 2 || total === 0) {
      var out = [];
      for (var k = 0; k < n; k++) out.push(points[0]);
      return out;
    }
    var step = total / (n - 1);
    var result = [points[0]];
    var acc = 0;
    var prev = points[0];
    for (var i = 1; i < points.length && result.length < n; i++) {
      var cur = points[i];
      var d = dist(prev, cur);
      while (acc + d >= step && result.length < n) {
        var t = (step - acc) / d;
        var p = { x: prev.x + t * (cur.x - prev.x), y: prev.y + t * (cur.y - prev.y) };
        result.push(p);
        prev = p;
        d = dist(prev, cur);
        acc = 0;
      }
      acc += d;
      prev = cur;
    }
    while (result.length < n) result.push(points[points.length - 1]);
    return result;
  }

  function samplePath(pathEl, n) {
    var len = pathEl.getTotalLength();
    var pts = [];
    for (var i = 0; i < n; i++) {
      var p = pathEl.getPointAtLength(len * i / (n - 1));
      pts.push({ x: p.x, y: p.y });
    }
    return pts;
  }

  // なぞった線とお手本の線のずれ（小さいほど近い）
  function deviation(a, template) {
    var sum = 0;
    for (var i = 0; i < SAMPLES; i++) sum += dist(a[i], template[i]);
    return sum / SAMPLES + dist(a[0], template[0]) + dist(a[SAMPLES - 1], template[SAMPLES - 1]);
  }

  // なぞった線がお手本の線と合っているか
  function matches(drawn, template, templateLength) {
    var a = resample(drawn, SAMPLES);
    if (dist(a[0], template[0]) > MAX_END_DIST) return false;
    if (dist(a[SAMPLES - 1], template[SAMPLES - 1]) > MAX_END_DIST) return false;
    // 点のように短い線は、はじめと終わりが合っていればよい
    if (templateLength < 15) return true;
    var sum = 0;
    for (var i = 0; i < SAMPLES; i++) sum += dist(a[i], template[i]);
    return sum / SAMPLES <= MAX_MEAN_DIST;
  }

  // container: なぞる枠を入れる要素 / strokes: 書き順どおりの線（path の d）
  // handlers: onStrokeOk(index), onStrokeFail(failCount), onAutoStroke(index), onDone()
  function create(container, strokes, handlers) {
    var h = handlers || {};
    var current = 0;
    var fails = 0;
    var busy = false;
    var drawing = null;

    var svg = el('svg', { viewBox: '0 0 109 109', class: 'trace-svg', 'aria-label': 'なぞる わく' });
    // マス目のガイド
    svg.appendChild(el('rect', { x: 1, y: 1, width: 107, height: 107, rx: 6, class: 'trace-frame' }));
    svg.appendChild(el('path', { d: 'M54.5 4 V105 M4 54.5 H105', class: 'trace-guide' }));

    var ghostGroup = el('g', { class: 'trace-ghost' });
    var doneGroup = el('g', { class: 'trace-done' });
    var templates = strokes.map(function (d) {
      var p = el('path', { d: d });
      ghostGroup.appendChild(p);
      return p;
    });
    var highlight = el('path', { class: 'trace-current' });
    var startDot = el('circle', { r: 4.5, class: 'trace-start' });
    var ink = el('polyline', { class: 'trace-ink', points: '' });
    svg.appendChild(ghostGroup);
    svg.appendChild(doneGroup);
    svg.appendChild(highlight);
    svg.appendChild(startDot);
    svg.appendChild(ink);
    container.innerHTML = '';
    container.appendChild(svg);

    // 判定用の点（画面に出してから計算する）
    var sampled = templates.map(function (p) { return samplePath(p, SAMPLES); });
    var lengths = templates.map(function (p) { return p.getTotalLength(); });

    function showCurrent() {
      if (current >= strokes.length) {
        highlight.style.display = 'none';
        startDot.style.display = 'none';
        return;
      }
      highlight.setAttribute('d', strokes[current]);
      var s = sampled[current][0];
      startDot.setAttribute('cx', s.x);
      startDot.setAttribute('cy', s.y);
      highlight.style.display = '';
      startDot.style.display = '';
    }

    function addDone(index, animate) {
      var p = el('path', { d: strokes[index] });
      if (animate) {
        var len = lengths[index];
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        doneGroup.appendChild(p);
        p.getBoundingClientRect();
        p.style.transition = 'stroke-dashoffset 0.7s ease-in-out';
        p.style.strokeDashoffset = 0;
      } else {
        doneGroup.appendChild(p);
      }
    }

    function advance() {
      current += 1;
      fails = 0;
      showCurrent();
      if (current >= strokes.length && h.onDone) {
        busy = true;
        setTimeout(h.onDone, 500);
      }
    }

    // 似た線が近くにある字（青・学など）で、まだ書いていない線をなぞったのに合格にしないため
    function closerToLaterStroke(points) {
      var a = resample(points, SAMPLES);
      var mine = deviation(a, sampled[current]);
      for (var i = current + 1; i < strokes.length; i++) {
        if (deviation(a, sampled[i]) < mine) return true;
      }
      return false;
    }

    function toSvgPoint(e) {
      var pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      var p = pt.matrixTransform(svg.getScreenCTM().inverse());
      return { x: p.x, y: p.y };
    }

    function drawInk() {
      ink.setAttribute('points', drawing.points.map(function (p) {
        return p.x.toFixed(1) + ',' + p.y.toFixed(1);
      }).join(' '));
    }

    function onDown(e) {
      if (busy || drawing || current >= strokes.length) return;
      e.preventDefault();
      drawing = { id: e.pointerId, points: [toSvgPoint(e)] };
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* なくても動く */ }
      drawInk();
    }

    function onMove(e) {
      if (!drawing || e.pointerId !== drawing.id) return;
      e.preventDefault();
      drawing.points.push(toSvgPoint(e));
      drawInk();
    }

    function onUp(e) {
      if (!drawing || e.pointerId !== drawing.id) return;
      var points = drawing.points;
      drawing = null;
      ink.setAttribute('points', '');
      // タッチしただけ（短すぎる線）は数えない
      if (polylineLength(points) < MIN_DRAW_LENGTH && lengths[current] >= MIN_DRAW_LENGTH) return;

      if (matches(points, sampled[current], lengths[current]) && !closerToLaterStroke(points)) {
        addDone(current, false);
        if (h.onStrokeOk) h.onStrokeOk(current);
        advance();
        return;
      }
      fails += 1;
      if (fails >= MAX_FAILS) {
        busy = true;
        var index = current;
        addDone(index, true);
        if (h.onAutoStroke) h.onAutoStroke(index);
        setTimeout(function () {
          busy = false;
          advance();
        }, 800);
      } else if (h.onStrokeFail) {
        h.onStrokeFail(fails);
      }
    }

    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', function () {
      drawing = null;
      ink.setAttribute('points', '');
    });

    showCurrent();

    return {
      strokeCount: strokes.length,
      current: function () { return current; },
      destroy: function () {
        busy = true;
        container.innerHTML = '';
      }
    };
  }

  root.Trace = {
    create: create,
    resample: resample,
    MAX_FAILS: MAX_FAILS
  };
})(typeof window !== 'undefined' ? window : globalThis);
