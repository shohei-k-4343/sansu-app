// えいご：英語の読み上げ（SPEC.md 15-5）
// iPad に入っている英語の声を使う。声はインターネットに送らない
(function (root) {
  'use strict';

  var RATE = 0.8;     // ゆっくりめ
  var PITCH = 1.05;
  var voice = null;

  function synth() {
    return root.speechSynthesis || null;
  }

  // アメリカ英語の声を優先して選ぶ
  function pickVoice() {
    var s = synth();
    if (!s) return null;
    var voices = s.getVoices() || [];
    var english = voices.filter(function (v) { return /^en([-_]|$)/i.test(v.lang); });
    var us = english.filter(function (v) { return /^en[-_]US/i.test(v.lang); });
    var local = function (list) { return list.filter(function (v) { return v.localService; }); };
    voice = local(us)[0] || us[0] || local(english)[0] || english[0] || null;
    return voice;
  }

  if (synth()) {
    pickVoice();
    // 声の一覧はあとから読み込まれることがある
    synth().addEventListener && synth().addEventListener('voiceschanged', pickVoice);
  }

  function supported() {
    return !!synth() && typeof root.SpeechSynthesisUtterance === 'function';
  }

  function hasEnglishVoice() {
    return supported() && !!(voice || pickVoice());
  }

  // 読み上げ中は BGM を小さくする（SPEC.md 16-2）
  function duck(on) {
    if (root.Sound) root.Sound.duckForSpeech(on);
  }

  var current = null;
  var DUCK_MAX_MS = 4000;  // 読み上げの終わりが知らされなくても、この時間で BGM を元にもどす

  function speak(text) {
    if (!supported()) return false;
    var s = synth();
    s.cancel();
    var u = new root.SpeechSynthesisUtterance(text);
    u.lang = voice ? voice.lang : 'en-US';
    if (voice) u.voice = voice;
    u.rate = RATE;
    u.pitch = PITCH;
    current = u;
    var finish = function () {
      if (current !== u) return;
      current = null;
      duck(false);
    };
    u.onend = finish;
    u.onerror = finish;
    setTimeout(finish, DUCK_MAX_MS);
    duck(true);
    s.speak(u);
    return true;
  }

  function stop() {
    current = null;
    duck(false);
    if (supported()) synth().cancel();
  }

  root.Speech = {
    supported: supported,
    hasEnglishVoice: hasEnglishVoice,
    speak: speak,
    stop: stop
  };
})(typeof window !== 'undefined' ? window : globalThis);
