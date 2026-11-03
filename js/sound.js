// BGM と効果音（SPEC.md 16章）
// sounds フォルダの音楽ファイルを Web Audio で鳴らす（音の大きさを変えられるように）
// ファイルが読めなかったときは、プログラムで作った音で代わりに鳴らす
(function (root) {
  'use strict';

  // BGM：魔王魂（CC BY 4.0、「音楽：魔王魂」の表示が必要）／効果音：効果音ラボ
  var FILES = {
    home: 'sounds/maou_bgm_acoustic44.mp3',
    quiz: 'sounds/maou_bgm_acoustic21.mp3',
    tap: 'sounds/tap.mp3',
    correct: 'sounds/correct.mp3',
    wrong: 'sounds/wrong.mp3',
    levelup: 'sounds/levelup.mp3',
    reward: 'sounds/reward.mp3'
  };
  // ファイルごとの音の大きさ（0〜1）
  // （BGM はもともと大きめの音で作られているので小さく、効果音は小さめなのでそのまま）
  var VOLUME = { home: 0.3, quiz: 0.22, tap: 0.8, correct: 1, wrong: 1, levelup: 1, reward: 1 };

  var NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  var LOOKAHEAD = 0.25;       // 何秒先までの音を予約しておくか
  var DUCK_LEVEL = 0.2;       // 読み上げ・ファンファーレ中の BGM の大きさ

  // 「C5」「F#4」などの音名を周波数にする
  function noteFreq(name) {
    var m = /^([A-G])(#|b)?(\d)$/.exec(name);
    if (!m) return null;
    var semi = NOTE_INDEX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    var midi = 12 * (Number(m[3]) + 1) + semi;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // 楽譜：8分音符1つ＝1つの記号。「.」はやすみ、「_」は前の音をのばす、「|」は小節の区切り（見やすくするだけ）
  function parseTrack(text) {
    var tokens = text.trim().split(/\s+/).filter(function (t) { return t !== '|'; });
    var steps = tokens.map(function () { return null; });
    var last = -1;
    tokens.forEach(function (t, i) {
      if (t === '_') {
        if (last >= 0) steps[last].len += 1;
        return;
      }
      if (t === '.') {
        last = -1;
        return;
      }
      steps[i] = { freq: noteFreq(t), len: 1 };
      last = i;
    });
    return { length: tokens.length, steps: steps };
  }

  // ファイルが読めなかったときの代わりの曲（どちらも8小節でくり返す）
  var SONGS = {
    // あかるい曲：タイトル・ホーム・けっか・ごほうび・きせかえ
    home: {
      bpm: 126,
      volume: 0.55,
      tracks: [
        { wave: 'square', gain: 0.05, decay: 0.45, notes:
          'C5 E5 G5 E5 C6 _ G5 _ | A5 _ G5 E5 C5 _ E5 _ | F5 _ A5 _ C6 _ A5 G5 | G5 _ _ _ D5 _ . . | ' +
          'E5 G5 C6 G5 E5 _ G5 _ | A5 C6 A5 G5 E5 _ . . | F5 _ A5 _ G5 _ B5 _ | C6 _ _ _ . . . .' },
        { wave: 'triangle', gain: 0.16, decay: 0.5, notes:
          'C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | ' +
          'C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | F2 . C3 . G2 . D3 . | C3 . G2 . C3 . . .' }
      ]
    },
    // もんだいの曲：小さめでおだやか
    quiz: {
      bpm: 88,
      volume: 0.4,
      tracks: [
        { wave: 'triangle', gain: 0.07, decay: 0.5, notes:
          'E5 _ _ _ G5 _ _ _ | G5 _ _ _ E5 _ . . | F5 _ _ _ A5 _ _ _ | G5 _ _ _ D5 _ . . | ' +
          'E5 _ G5 _ C6 _ _ _ | C6 _ B5 _ A5 _ _ _ | A5 _ _ _ F5 _ _ _ | D5 _ _ _ . . . .' },
        { wave: 'sine', gain: 0.06, decay: 0.4, notes:
          'C4 E4 G4 E4 C4 E4 G4 E4 | B3 E4 G4 E4 B3 E4 G4 E4 | A3 C4 F4 C4 A3 C4 F4 C4 | B3 D4 G4 D4 B3 D4 G4 D4 | ' +
          'C4 E4 G4 E4 C4 E4 G4 E4 | A3 C4 E4 C4 A3 C4 E4 C4 | A3 C4 F4 C4 A3 C4 F4 C4 | B3 D4 G4 D4 B3 D4 G4 D4' },
        { wave: 'triangle', gain: 0.1, decay: 0.6, notes:
          'C3 _ _ _ _ _ _ _ | E3 _ _ _ _ _ _ _ | F2 _ _ _ _ _ _ _ | G2 _ _ _ _ _ _ _ | ' +
          'C3 _ _ _ _ _ _ _ | A2 _ _ _ _ _ _ _ | F2 _ _ _ _ _ _ _ | G2 _ _ _ _ _ _ _' }
      ]
    }
  };

  var ctx = null;
  var bgmBus = null;
  var sfxBus = null;
  var softBgm = null;         // プログラムの音だけ通す、高い音を丸めるフィルター
  var softSfx = null;
  var buffers = {};           // 読み込んだ音。undefined＝読み込み中、false＝読めなかった
  var unlocked = false;
  var enabled = { bgm: true, sfx: true };
  var wanted = null;          // 今の画面で流したい曲
  var playing = null;         // 今流している曲
  var timerId = null;
  var ducks = { speech: false, fanfare: false };
  var fanfareTimeout = null;

  function ensureContext() {
    if (ctx) return ctx;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch (e) {
      return null;
    }
    var master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    bgmBus = ctx.createGain();
    bgmBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.connect(master);
    softBgm = softFilter(bgmBus);
    softSfx = softFilter(sfxBus);
    loadFiles();
    return ctx;
  }

  // 高い音をすこし丸くして、耳にやさしくする
  function softFilter(dest) {
    var f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 4000;
    f.connect(dest);
    return f;
  }

  function loadFiles() {
    Object.keys(FILES).forEach(function (name) {
      root.fetch(FILES[name]).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.arrayBuffer();
      }).then(function (data) {
        return new Promise(function (resolve, reject) { ctx.decodeAudioData(data, resolve, reject); });
      }).then(function (buffer) {
        buffers[name] = buffer;
      }, function () {
        buffers[name] = false;
      }).then(function () {
        if (name === wanted) updateBgm();
      });
    });
  }

  // iPad は、画面にさわったときでないと音を鳴らし始められない
  function unlock() {
    var c = ensureContext();
    if (!c) return;
    if (c.state !== 'running' && !(root.document && root.document.hidden)) {
      var p = c.resume();
      if (p && p.then) p.then(updateBgm, function () { /* 鳴らせなくても遊べる */ });
    }
    if (!unlocked) {
      // 無音を1回鳴らすと、iPad で音が出るようになる
      var src = c.createBufferSource();
      src.buffer = c.createBuffer(1, 1, 22050);
      src.connect(c.destination);
      src.start(0);
      unlocked = true;
    }
    updateBgm();
  }

  function running() {
    return ctx && unlocked && ctx.state === 'running';
  }

  // 1つの音を鳴らす。はじめにポンと出て、だんだん小さくなる
  function tone(dest, wave, freq, start, dur, peak, opts) {
    var o = opts || {};
    var release = o.release || 0.08;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.008);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * (o.decay || 0.4)), start + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur + release);
    osc.connect(g);
    g.connect(dest);
    osc.start(start);
    osc.stop(start + dur + release + 0.02);
  }

  // ---------- BGM ----------

  // 音楽ファイルの曲をくり返し流す
  function startFileSong(name, buffer) {
    var now = ctx.currentTime;
    var out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(VOLUME[name], now + 0.8);
    out.connect(bgmBus);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(out);
    source.start(now);
    return { name: name, out: out, source: source };
  }

  // プログラムで作る曲（ファイルが読めなかったとき）
  function startSong(name) {
    var song = SONGS[name];
    var tracks = song.tracks.map(function (t) {
      return { wave: t.wave, gain: t.gain, decay: t.decay, parsed: parseTrack(t.notes) };
    });
    var now = ctx.currentTime;
    var out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(song.volume, now + 0.8);
    out.connect(softBgm);
    return {
      name: name,
      synth: true,
      tracks: tracks,
      length: tracks[0].parsed.length,
      stepDur: 60 / song.bpm / 2,
      out: out,
      step: 0,
      nextTime: now + 0.1
    };
  }

  // 曲をふわっと小さくして止める
  function stopSong(p) {
    var now = ctx.currentTime;
    p.out.gain.cancelScheduledValues(now);
    p.out.gain.setValueAtTime(p.out.gain.value, now);
    p.out.gain.linearRampToValueAtTime(0, now + 0.4);
    if (p.source) p.source.stop(now + 0.45);
    setTimeout(function () { p.out.disconnect(); }, 1000);
  }

  function scheduleStep(p, step, time) {
    p.tracks.forEach(function (t) {
      var note = t.parsed.steps[step];
      if (!note || !note.freq) return;
      tone(p.out, t.wave, note.freq, time, note.len * p.stepDur * 0.92, t.gain, { decay: t.decay });
    });
  }

  function tick() {
    if (!playing || !playing.synth) {
      clearInterval(timerId);
      timerId = null;
      return;
    }
    var now = ctx.currentTime;
    // 止まっていたあとに、たまった音がまとめて鳴らないようにする
    if (playing.nextTime < now - 0.1) playing.nextTime = now + 0.05;
    while (playing.nextTime < now + LOOKAHEAD) {
      scheduleStep(playing, playing.step, playing.nextTime);
      playing.step = (playing.step + 1) % playing.length;
      playing.nextTime += playing.stepDur;
    }
  }

  function updateBgm() {
    var target = enabled.bgm ? wanted : null;
    if (!running()) target = null;
    if (playing && playing.name === target) return;
    if (playing) stopSong(playing);
    playing = null;
    // 読み込み中なら、読み込めたときにもう一度ここが呼ばれる
    if (!target || buffers[target] === undefined) return;
    if (buffers[target]) {
      playing = startFileSong(target, buffers[target]);
      return;
    }
    playing = startSong(target);
    if (!timerId) timerId = setInterval(tick, 60);
    tick();
  }

  // name: 'home' / 'quiz' / null（止める）
  function setBgm(name) {
    wanted = SONGS[name] ? name : null;
    updateBgm();
  }

  function applyDuck() {
    if (!bgmBus) return;
    var level = ducks.speech || ducks.fanfare ? DUCK_LEVEL : 1;
    bgmBus.gain.setTargetAtTime(level, ctx.currentTime, 0.08);
  }

  // えいごの読み上げ中は BGM を小さくする
  function duckForSpeech(on) {
    ducks.speech = !!on;
    applyDuck();
  }

  // ---------- 効果音 ----------

  // ファイルが読めなかったときの代わりの音
  var SFX = {
    // ポッ
    tap: function (t) {
      tone(softSfx, 'sine', 660, t, 0.06, 0.16, { slideTo: 990, release: 0.04 });
    },
    // ピンポン♪
    correct: function (t) {
      tone(softSfx, 'triangle', noteFreq('E6'), t, 0.14, 0.2, { decay: 0.6 });
      tone(softSfx, 'sine', noteFreq('E6'), t, 0.14, 0.1, { decay: 0.6 });
      tone(softSfx, 'triangle', noteFreq('C6'), t + 0.15, 0.5, 0.2, { decay: 0.3, release: 0.15 });
      tone(softSfx, 'sine', noteFreq('C6'), t + 0.15, 0.5, 0.1, { decay: 0.3, release: 0.15 });
    },
    // ポワン（責めない、やさしい音）
    wrong: function (t) {
      tone(softSfx, 'sine', 523, t, 0.38, 0.14, { slideTo: 392, decay: 0.5, release: 0.12 });
      tone(softSfx, 'triangle', 262, t, 0.38, 0.05, { slideTo: 196, decay: 0.5, release: 0.12 });
    },
    // ファンファーレ
    levelup: function (t) {
      ['G4', 'C5', 'E5', 'G5'].forEach(function (n, i) {
        tone(softSfx, 'square', noteFreq(n), t + i * 0.11, 0.1, 0.07, { decay: 0.7 });
      });
      var top = t + 0.48;
      tone(softSfx, 'square', noteFreq('C6'), top, 0.8, 0.07, { decay: 0.4, release: 0.25 });
      ['C5', 'E5', 'G5'].forEach(function (n) {
        tone(softSfx, 'triangle', noteFreq(n), top, 0.8, 0.08, { decay: 0.4, release: 0.25 });
      });
    },
    // キラキラ
    reward: function (t) {
      ['C6', 'E6', 'G6', 'C7', 'E7', 'G6', 'C7', 'E7', 'G7'].forEach(function (n, i) {
        tone(softSfx, 'sine', noteFreq(n), t + i * 0.07, 0.12, 0.09, { decay: 0.3, release: 0.2 });
      });
    }
  };

  function play(name) {
    if (!enabled.sfx || !SFX[name] || !running()) return;
    var buffer = buffers[name];
    var t = ctx.currentTime + 0.01;
    if (buffer === undefined) return;  // まだ読み込み中
    var length = 1.5;
    if (buffer) {
      var g = ctx.createGain();
      g.gain.value = VOLUME[name];
      g.connect(sfxBus);
      var source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(g);
      source.start(t);
      length = buffer.duration;
    } else {
      SFX[name](t);
    }
    if (name === 'levelup') {
      ducks.fanfare = true;
      applyDuck();
      clearTimeout(fanfareTimeout);
      fanfareTimeout = setTimeout(function () {
        ducks.fanfare = false;
        applyDuck();
      }, (length + 0.3) * 1000);
    }
  }

  // settings: { bgm: true/false, sfx: true/false }
  function setEnabled(settings) {
    enabled.bgm = settings.bgm !== false;
    enabled.sfx = settings.sfx !== false;
    updateBgm();
  }

  if (root.document) {
    ['touchend', 'pointerup', 'click', 'keydown'].forEach(function (type) {
      root.document.addEventListener(type, unlock, true);
    });
    // ほかのアプリに切り替えたら止め、もどったら再開する
    root.document.addEventListener('visibilitychange', function () {
      if (!ctx || !unlocked) return;
      if (root.document.hidden) ctx.suspend();
      else ctx.resume().then(updateBgm, function () { /* 次にさわったときに再開 */ });
    });
  }

  var api = {
    SONGS: SONGS,
    noteFreq: noteFreq,
    parseTrack: parseTrack,
    setBgm: setBgm,
    play: play,
    setEnabled: setEnabled,
    duckForSpeech: duckForSpeech
  };

  root.Sound = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
