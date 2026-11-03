// 画面の切り替えと全体の流れ（SPEC.md 5「画面一覧」・11「エラー時の動作」）
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var CORRECT_DELAY_MS = 1100;
  var RETRY_DELAY_MS = 1500;
  var DEV_MODE = /[?&]dev=1\b/.test(location.search);

  var state = {
    data: null,
    saveOk: true,
    screen: null,
    quiz: null,
    rewardItems: [],
    closetSlot: 'clothes',
    adultAnswer: null,
    feedbackNext: null
  };

  // 教科ごとの記録・ルール
  function subjectRecord(subject) {
    if (subject === 'kokugo') return state.data.kokugo;
    if (subject === 'eigo') return state.data.eigo;
    return state.data;
  }

  function subjectRules(subject) {
    if (subject === 'kokugo') return Kokugo;
    if (subject === 'eigo') return Eigo;
    return Problems;
  }

  // ---------- 共通 ----------

  function persist() {
    state.saveOk = SaveData.save(state.data);
    $('save-warning').hidden = state.saveOk;
  }

  function displayName() {
    var name = state.data.childName;
    return /(ちゃん|くん|さん)$/.test(name) ? name : name + 'ちゃん';
  }

  // 画面ごとの BGM（SPEC.md 16-2）
  var BGM_FOR = { quiz: 'quiz', kokugo: 'quiz', eigo: 'quiz' };

  function showScreen(name) {
    $('quiz-feedback').hidden = true;
    Sound.setBgm(BGM_FOR[name] || 'home');
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.toggle('active', screens[i].id === 'screen-' + name);
    }
    state.screen = name;
    if (renderers[name]) renderers[name]();
  }

  // ---------- 1. タイトル ----------

  function renderTitle() {
    var hasName = state.data.childName !== '';
    $('title-avatar').innerHTML = Avatar.renderAvatar(state.data.equipped);
    $('name-form').hidden = hasName;
    $('name-error').hidden = true;
    $('name-input').value = '';
    $('title-greeting').textContent = hasName ? 'おかえり、' + displayName() + '！' : '';
    $('title-greeting').hidden = !hasName;
  }

  function onStart() {
    if (state.data.childName === '') {
      var name = SaveData.cleanName($('name-input').value);
      if (name === '') {
        $('name-error').hidden = false;
        return;
      }
      state.data.childName = name;
      state.data.createdAt = new Date().toISOString();
      persist();
    }
    $('name-input').blur();
    showScreen('home');
  }

  // ---------- 2. ホーム ----------

  function renderHome() {
    var d = state.data;
    $('home-avatar').innerHTML = Avatar.renderAvatar(d.equipped);
    $('home-name').textContent = displayName();
    renderBgmButton();
    ['sansu', 'kokugo', 'eigo'].forEach(renderSubjectRow);
    $('dev-buttons').hidden = !DEV_MODE;
  }

  function renderSubjectRow(subject) {
    var rec = subjectRecord(subject);
    var rules = subjectRules(subject);
    var toNext = rules.correctToNextLevel(rec.totalCorrect);
    var filled = toNext === 0 ? rules.CORRECT_PER_LEVEL : rules.CORRECT_PER_LEVEL - toNext;
    var stars = '';
    for (var i = 0; i < rules.CORRECT_PER_LEVEL; i++) stars += Avatar.renderStar(i < filled);
    $('home-level-' + subject).textContent = 'レベル ' + rec.level;
    $('home-stars-' + subject).innerHTML = stars;
    $('home-next-' + subject).textContent = toNext === 0 ? 'さいこう レベル！' : 'あと ' + toNext + 'もん';
  }

  // ---------- 音（SPEC.md 16章） ----------

  var BGM_ON_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 18 L16 18 L26 9 L26 39 L16 30 L8 30 Z" fill="#8a6f7d"/>' +
    '<path d="M31 17 Q36 24 31 31 M35 12 Q43 24 35 36" stroke="#8a6f7d" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>';
  var BGM_OFF_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 18 L16 18 L26 9 L26 39 L16 30 L8 30 Z" fill="#c4b3bc"/>' +
    '<path d="M32 18 L42 30 M42 18 L32 30" stroke="#e0607e" stroke-width="3.5" stroke-linecap="round"/></svg>';

  function applySound() {
    Sound.setEnabled(state.data.settings);
  }

  function renderBgmButton() {
    var on = state.data.settings.bgm;
    $('bgm-btn').innerHTML = on ? BGM_ON_ICON : BGM_OFF_ICON;
    $('bgm-btn').setAttribute('aria-label', on ? 'おんがくを とめる' : 'おんがくを ながす');
  }

  function setSoundSetting(key, on) {
    state.data.settings[key] = on;
    persist();
    applySound();
    renderBgmButton();
  }

  // 動作確認用：正解数を1レベルぶん増やす（?dev=1 のときだけ表示）
  function onDevLevelUp(subject) {
    addCorrect(subject, subjectRules(subject).CORRECT_PER_LEVEL);
    persist();
    renderHome();
  }

  function addCorrect(subject, n) {
    subjectRecord(subject).totalCorrect += n;
    SaveData.refreshOwned(state.data);
  }

  // ---------- 3. もんだい ----------

  function startQuiz() {
    state.quiz = {
      subject: 'sansu',
      set: Problems.buildSet(state.data.level, state.data.mistakes),
      index: 0,
      input: '',
      tries: 0,
      correctCount: 0,
      levelBefore: state.data.level,
      locked: false,
      timer: null,
      feedbackTimeout: null
    };
    showScreen('quiz');
  }

  function currentProblem() {
    return state.quiz.set[state.quiz.index];
  }

  function renderQuiz() {
    var q = state.quiz;
    var p = currentProblem();
    $('quiz-progress').textContent = (q.index + 1) + ' / ' + q.set.length;
    $('quiz-question').innerHTML = p.a + ' <span class="op">' + (p.op === '+' ? '＋' : '−') + '</span> ' + p.b + ' ＝';
    $('quiz-dots').innerHTML = renderDots(p);
    $('quiz-feedback').hidden = true;
    renderInput();
    startTimer(Problems.timerSeconds(state.data.level));
  }

  // ●の絵（10以下の数のときだけ）
  function renderDots(p) {
    if (p.a > 10 || p.b > 10) return '';
    function group(count, cls, goneFrom) {
      var html = '<div class="dot-group ' + cls + '">';
      for (var i = 0; i < count; i++) {
        html += '<span class="dot' + (goneFrom !== undefined && i >= goneFrom ? ' gone' : '') + '"></span>';
      }
      return html + '</div>';
    }
    if (p.op === '+') {
      return group(p.a, 'a') + '<span class="dot-op">＋</span>' + group(p.b, 'b');
    }
    // ひき算は、ひく分を点線にする
    return group(p.a, 'a', p.a - p.b);
  }

  function renderInput() {
    $('quiz-answer').textContent = state.quiz.input;
    $('key-ok').disabled = state.quiz.input === '' || state.quiz.locked;
  }

  function pressKey(key) {
    var q = state.quiz;
    if (!q || q.locked) return;
    if (key === 'ok') {
      submitAnswer();
      return;
    }
    if (key === 'clear') {
      q.input = q.input.slice(0, -1);
    } else if (q.input.length < 2) {
      q.input = q.input === '0' ? key : q.input + key;
    }
    renderInput();
  }

  function submitAnswer() {
    var q = state.quiz;
    if (q.input === '' || q.locked) return;
    var p = currentProblem();
    var answer = Problems.answerOf(p);

    if (Number(q.input) === answer) {
      // 1回目で正解したら、間違えた問題リストから消す
      if (q.tries === 0) state.data.mistakes = Problems.removeMistake(state.data.mistakes, p);
      q.correctCount += 1;
      addCorrect('sansu', 1);
      persist();
      stopTimer();
      showFeedback('correct');
      q.feedbackTimeout = setTimeout(nextQuestion, CORRECT_DELAY_MS);
      return;
    }

    if (q.tries === 0) {
      q.tries = 1;
      state.data.mistakes = Problems.recordMistake(state.data.mistakes, p, new Date().toISOString());
      persist();
      pauseTimer();
      showFeedback('retry');
      q.feedbackTimeout = setTimeout(function () {
        q.input = '';
        q.locked = false;
        $('quiz-feedback').hidden = true;
        renderInput();
        resumeTimer();
      }, RETRY_DELAY_MS);
      return;
    }

    stopTimer();
    showFeedback('answer');
  }

  function onTimeout() {
    var q = state.quiz;
    if (!q || q.locked) return;
    if (q.tries === 0) {
      state.data.mistakes = Problems.recordMistake(state.data.mistakes, currentProblem(), new Date().toISOString());
      persist();
    }
    showFeedback('timeout');
  }

  function showFeedback(kind) {
    var q = state.quiz;
    var p = currentProblem();
    var equation = p.a + ' ' + (p.op === '+' ? '＋' : '−') + ' ' + p.b + ' ＝ ' + Problems.answerOf(p);
    q.locked = true;
    renderInput();

    var texts = {
      correct: 'せいかい！',
      retry: 'おしい！',
      answer: 'こたえは ' + Problems.answerOf(p) + ' だよ',
      timeout: 'じかんぎれ！'
    };
    var subs = {
      correct: '',
      retry: 'もういちど やってみよう',
      answer: equation,
      timeout: 'こたえは ' + equation
    };
    openFeedback(kind === 'correct', texts[kind], subs[kind], kind === 'answer' || kind === 'timeout' ? nextQuestion : null);
  }

  // せいかい・おしい の表示。onNext があれば「つぎへ」ボタンを出す
  function openFeedback(good, text, sub, onNext) {
    Sound.play(good ? 'correct' : 'wrong');
    $('feedback-icon').innerHTML = good ? Avatar.renderHanamaru() : Avatar.renderSoftFace();
    $('feedback-text').textContent = text;
    $('feedback-text').classList.toggle('soft', !good);
    $('feedback-sub').textContent = sub;
    state.feedbackNext = onNext;
    $('feedback-next').hidden = !onNext;
    $('quiz-feedback').hidden = false;
  }

  function onFeedbackNext() {
    var next = state.feedbackNext;
    state.feedbackNext = null;
    if (next) next();
  }

  function nextQuestion() {
    var q = state.quiz;
    clearTimeout(q.feedbackTimeout);
    q.index += 1;
    q.input = '';
    q.tries = 0;
    q.locked = false;
    if (q.index >= q.set.length) {
      stopTimer();
      showScreen('result');
      return;
    }
    renderQuiz();
  }

  function quitQuiz() {
    if (state.quiz) {
      clearTimeout(state.quiz.feedbackTimeout);
      stopTimer();
      if (state.quiz.trace) state.quiz.trace.destroy();
      state.quiz = null;
    }
    showScreen('home');
  }

  // ---------- 3-2. こくご ----------

  function startKokugo() {
    state.quiz = {
      subject: 'kokugo',
      set: Kokugo.buildSet(state.data.kokugo.level, state.data.kokugo.mistakes),
      index: 0,
      tries: 0,
      correctCount: 0,
      levelBefore: state.data.kokugo.level,
      locked: false,
      trace: null,
      feedbackTimeout: null
    };
    showScreen('kokugo');
  }

  function currentKanji() {
    return Kanji.getKanji(state.quiz.set[state.quiz.index].kanji);
  }

  function renderKokugo() {
    var q = state.quiz;
    var k = currentKanji();
    q.tries = 0;
    q.locked = false;
    $('kokugo-progress').textContent = (q.index + 1) + ' / ' + q.set.length;
    $('kokugo-trace-phase').hidden = false;
    $('kokugo-read-phase').hidden = true;
    startTracing({ box: 'trace-box', instruction: 'kokugo-instruction', count: 'stroke-count', unit: 'かく' },
      KanjiStrokes[k.kanji], showReadPhase);
  }

  // なぞり（こくご・えいご 共通）。ids: 枠・説明文・画数の表示の id と、数え方（かく／ほん）
  function startTracing(ids, strokes, onDone) {
    var q = state.quiz;
    function say(text, oops) {
      $(ids.instruction).textContent = text;
      $(ids.instruction).classList.toggle('oops', oops);
    }
    function count(done) {
      $(ids.count).textContent = done >= strokes.length
        ? 'ぜんぶ かけたよ'
        : (done + 1) + ' ' + ids.unit + 'め ／ ' + strokes.length + ids.unit;
    }
    say('ひかっている せんを なぞってね', false);
    count(0);
    if (q.trace) q.trace.destroy();
    q.trace = Trace.create($(ids.box), strokes, {
      onStrokeOk: function (i) {
        say(i + 1 < strokes.length ? 'じょうず！ つぎの せんだよ' : 'できた！', false);
        count(i + 1);
      },
      onStrokeFail: function () {
        say('おしい！ ひかっている せんを なぞってね', true);
      },
      onAutoStroke: function (i) {
        say('おてほんを みてね', true);
        count(i + 1);
      },
      onDone: onDone
    });
  }

  function showReadPhase() {
    var k = currentKanji();
    $('kokugo-trace-phase').hidden = true;
    $('kokugo-read-phase').hidden = false;
    var sentence = $('kokugo-sentence');
    sentence.textContent = '';
    sentence.appendChild(document.createTextNode(k.before));
    var target = document.createElement('span');
    target.className = 'target';
    target.textContent = k.kanji;
    sentence.appendChild(target);
    sentence.appendChild(document.createTextNode(k.after));

    var html = '';
    Kokugo.choicesFor(k.kanji).forEach(function (reading) {
      html += '<button type="button" class="choice" data-choice="' + reading + '">' + reading + '</button>';
    });
    $('kokugo-choices').innerHTML = html;
  }

  function onChoice(e) {
    var btn = e.target.closest('[data-choice]');
    var q = state.quiz;
    if (!btn || !q || q.locked || btn.disabled) return;
    var k = currentKanji();
    var reading = btn.getAttribute('data-choice');
    var rec = state.data.kokugo;
    var fullReading = k.before + k.reading + k.after;

    if (reading === k.reading) {
      if (q.tries === 0) rec.mistakes = Kokugo.removeMistake(rec.mistakes, k.kanji);
      q.correctCount += 1;
      addCorrect('kokugo', 1);
      persist();
      q.locked = true;
      btn.classList.add('correct');
      openFeedback(true, 'せいかい！', fullReading, null);
      q.feedbackTimeout = setTimeout(nextKanji, CORRECT_DELAY_MS + 300);
      return;
    }

    btn.disabled = true;
    if (q.tries === 0) {
      q.tries = 1;
      rec.mistakes = Kokugo.recordMistake(rec.mistakes, k.kanji, new Date().toISOString());
      persist();
      q.locked = true;
      openFeedback(false, 'おしい！', 'もういちど えらんでね', null);
      q.feedbackTimeout = setTimeout(function () {
        q.locked = false;
        $('quiz-feedback').hidden = true;
      }, RETRY_DELAY_MS);
      return;
    }

    q.locked = true;
    openFeedback(false, 'こたえは「' + k.reading + '」だよ', fullReading, nextKanji);
  }

  function nextKanji() {
    var q = state.quiz;
    clearTimeout(q.feedbackTimeout);
    $('quiz-feedback').hidden = true;
    q.index += 1;
    if (q.index >= q.set.length) {
      if (q.trace) q.trace.destroy();
      showScreen('result');
      return;
    }
    renderKokugo();
  }

  // ---------- 3-3. えいご ----------

  var SPEAKER_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 18 L16 18 L26 9 L26 39 L16 30 L8 30 Z" fill="#fff"/>' +
    '<path d="M31 17 Q36 24 31 31 M35 12 Q43 24 35 36" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>';

  function startEigo() {
    state.quiz = {
      subject: 'eigo',
      set: Eigo.buildSet(state.data.eigo.level, state.data.eigo.mistakes),
      index: 0,
      tries: 0,
      correctCount: 0,
      levelBefore: state.data.eigo.level,
      locked: false,
      trace: null,
      feedbackTimeout: null
    };
    showScreen('eigo');
  }

  function currentEigo() {
    return Eigo.get(state.quiz.set[state.quiz.index].id);
  }

  function speakCurrent() {
    Speech.speak(currentEigo().say);
  }

  function showEigoPhase(name) {
    ['choose', 'trace', 'repeat'].forEach(function (p) {
      $('eigo-' + p + '-phase').hidden = p !== name;
    });
  }

  // ① 聞いて ② 選ぶ
  function renderEigo() {
    var q = state.quiz;
    var item = currentEigo();
    q.tries = 0;
    q.locked = false;
    $('eigo-progress').textContent = (q.index + 1) + ' / ' + q.set.length;
    $('eigo-voice-warning').hidden = Speech.hasEnglishVoice();
    showEigoPhase('choose');
    $('eigo-speak').innerHTML = SPEAKER_ICON;
    $('eigo-ask').textContent = item.type === 'letter' ? 'きいて、あう もじを えらんでね' : 'きいて、あう えを えらんでね';

    var html = '';
    Eigo.choicesFor(item.id).forEach(function (id) {
      var content = item.type === 'letter' ? '<span class="letter">' + id + '</span>' : EigoArt.word(id);
      html += '<button type="button" class="eigo-choice" data-eigo="' + id + '" aria-label="' + id + '">' + content + '</button>';
    });
    $('eigo-choices').innerHTML = html;
    speakCurrent();
  }

  function eigoLabel(item) {
    return item.type === 'letter' ? item.id : item.id + ' ＝ ' + item.ja;
  }

  function onEigoChoice(e) {
    var btn = e.target.closest('[data-eigo]');
    var q = state.quiz;
    if (!btn || !q || q.locked || btn.disabled) return;
    var item = currentEigo();
    var rec = state.data.eigo;

    if (btn.getAttribute('data-eigo') === item.id) {
      if (q.tries === 0) rec.mistakes = Eigo.removeMistake(rec.mistakes, item.id);
      q.correctCount += 1;
      addCorrect('eigo', 1);
      persist();
      q.locked = true;
      btn.classList.add('correct');
      openFeedback(true, 'せいかい！', eigoLabel(item), null);
      speakCurrent();
      q.feedbackTimeout = setTimeout(afterEigoChoice, CORRECT_DELAY_MS + 300);
      return;
    }

    btn.disabled = true;
    if (q.tries === 0) {
      q.tries = 1;
      rec.mistakes = Eigo.recordMistake(rec.mistakes, item.id, new Date().toISOString());
      persist();
      q.locked = true;
      openFeedback(false, 'おしい！', 'もういちど きいて えらんでね', null);
      q.feedbackTimeout = setTimeout(function () {
        q.locked = false;
        $('quiz-feedback').hidden = true;
        speakCurrent();
      }, RETRY_DELAY_MS);
      return;
    }

    q.locked = true;
    $('eigo-choices').querySelector('[data-eigo="' + item.id + '"]').classList.add('correct');
    openFeedback(false, 'こたえは これだよ', eigoLabel(item), afterEigoChoice);
    speakCurrent();
  }

  // ③ なぞる（アルファベットだけ）→ ④ まねして言う
  function afterEigoChoice() {
    var q = state.quiz;
    clearTimeout(q.feedbackTimeout);
    $('quiz-feedback').hidden = true;
    var item = currentEigo();
    if (item.type === 'letter') {
      showEigoPhase('trace');
      startTracing({ box: 'eigo-trace-box', instruction: 'eigo-instruction', count: 'eigo-stroke-count', unit: 'ほん' },
        Eigo.LETTER_STROKES[item.id], showEigoRepeat);
    } else {
      showEigoRepeat();
    }
  }

  function showEigoRepeat() {
    var item = currentEigo();
    var showKana = state.data.settings.showKatakana;
    var words = '<div class="words">' +
      (item.type === 'word' ? '<span class="en">' + item.id + '</span>' : '') +
      (showKana ? '<span class="kana">' + item.kana + '</span>' : '') +
      (item.type === 'word' ? '<span class="ja">' + item.ja + '</span>' : '') +
      '</div>';
    $('eigo-card').innerHTML = item.type === 'letter'
      ? '<span class="big-letter">' + item.id + '</span>' + words
      : '<div class="pic">' + EigoArt.word(item.id) + '</div>' + words;
    showEigoPhase('repeat');
    speakCurrent();
  }

  function nextEigo() {
    var q = state.quiz;
    Speech.stop();
    q.index += 1;
    if (q.index >= q.set.length) {
      if (q.trace) q.trace.destroy();
      showScreen('result');
      return;
    }
    renderEigo();
  }

  // ---------- タイマー（レベル8以上） ----------

  function startTimer(seconds) {
    stopTimer();
    $('quiz-timer').hidden = seconds === 0;
    if (seconds === 0) return;
    var t = state.quiz.timer = {
      total: seconds * 1000,
      remaining: seconds * 1000,
      deadline: Date.now() + seconds * 1000,
      paused: false,
      intervalId: null
    };
    updateTimerBar();
    t.intervalId = setInterval(function () {
      if (t.paused) return;
      t.remaining = Math.max(0, t.deadline - Date.now());
      updateTimerBar();
      if (t.remaining === 0) {
        stopTimer();
        onTimeout();
      }
    }, 100);
  }

  function updateTimerBar() {
    var t = state.quiz && state.quiz.timer;
    if (!t) return;
    var ratio = t.remaining / t.total;
    $('quiz-timer-fill').style.width = (ratio * 100) + '%';
    $('quiz-timer-fill').classList.toggle('low', ratio < 0.3);
  }

  function pauseTimer() {
    var t = state.quiz && state.quiz.timer;
    if (t && !t.paused) {
      t.remaining = Math.max(0, t.deadline - Date.now());
      t.paused = true;
    }
  }

  function resumeTimer() {
    var t = state.quiz && state.quiz.timer;
    if (t && t.paused) {
      t.deadline = Date.now() + t.remaining;
      t.paused = false;
    }
  }

  function stopTimer() {
    var t = state.quiz && state.quiz.timer;
    if (t) {
      clearInterval(t.intervalId);
      state.quiz.timer = null;
    }
  }

  // ---------- 4. けっか ----------

  function renderResult() {
    var q = state.quiz;
    var total = q.set.length;
    var levelAfter = subjectRecord(q.subject).level;
    var leveledUp = levelAfter > q.levelBefore;
    state.rewardItems = Items.unlockedBetween(q.subject, q.levelBefore, levelAfter);

    $('result-score').innerHTML = total + 'もんちゅう <span class="big">' + q.correctCount + '</span>もん せいかい！';
    var message;
    if (q.correctCount === total) message = 'ぜんぶ せいかい！ すごい！';
    else if (q.correctCount >= Math.ceil(total / 2)) message = 'よく できたね！';
    else message = 'がんばったね！ つぎも やってみよう';
    $('result-message').textContent = displayName() + '、' + message;

    $('result-levelup').hidden = !leveledUp;
    if (leveledUp) Sound.play('levelup');
    $('result-levelup-sub').textContent = Items.SUBJECT_NAMES[q.subject] + ' レベル ' + levelAfter + ' に なったよ';
    $('result-reward').hidden = !(leveledUp && state.rewardItems.length > 0);
    $('result-again').hidden = !$('result-reward').hidden;
  }

  // ---------- 5. ごほうび ----------

  function renderReward() {
    var html = '';
    state.rewardItems.forEach(function (item) {
      html += '<div class="reward-item"><div class="thumb">' + Avatar.renderItem(item.id) + '</div>' +
        '<p>' + item.name + ' を もらったよ！</p></div>';
    });
    $('reward-items').innerHTML = html;
    Sound.play('reward');
  }

  function onRewardCloset() {
    if (state.rewardItems.length > 0) state.closetSlot = state.rewardItems[0].slot;
    showScreen('closet');
  }

  // ---------- 6. きせかえ ----------

  function renderCloset() {
    var d = state.data;
    $('closet-avatar').innerHTML = Avatar.renderAvatar(d.equipped);

    var tabs = '';
    Items.SLOTS.forEach(function (slot) {
      tabs += '<button type="button" class="tab' + (slot.id === state.closetSlot ? ' active' : '') +
        '" data-slot="' + slot.id + '">' + slot.name + '</button>';
    });
    $('closet-tabs').innerHTML = tabs;

    var slot = Items.SLOTS.filter(function (s) { return s.id === state.closetSlot; })[0];
    var equippedId = d.equipped[slot.id];
    var tiles = '';
    if (slot.allowNone) {
      tiles += '<button type="button" class="item-tile' + (equippedId === null ? ' selected' : '') +
        '" data-item="none"><div class="thumb"><span class="none-mark">✕</span></div><span class="name">なし</span></button>';
    }
    Items.itemsInSlot(slot.id).forEach(function (item) {
      var owned = d.ownedItems.indexOf(item.id) !== -1;
      if (owned) {
        tiles += '<button type="button" class="item-tile' + (equippedId === item.id ? ' selected' : '') +
          '" data-item="' + item.id + '"><div class="thumb">' + Avatar.renderItem(item.id) +
          '</div><span class="name">' + item.name + '</span></button>';
      } else {
        tiles += '<div class="item-tile locked"><div class="thumb">' + Avatar.renderItem(item.id) +
          '</div><span class="name">' + Items.SUBJECT_NAMES[item.subject] + '<br>レベル' + item.level + 'で もらえるよ</span></div>';
      }
    });
    $('closet-items').innerHTML = tiles;
  }

  function onClosetClick(e) {
    var tab = e.target.closest('[data-slot]');
    if (tab) {
      state.closetSlot = tab.getAttribute('data-slot');
      renderCloset();
      return;
    }
    var tile = e.target.closest('[data-item]');
    if (tile) {
      var id = tile.getAttribute('data-item');
      state.data.equipped[state.closetSlot] = id === 'none' ? null : id;
      persist();
      renderCloset();
    }
  }

  // ---------- おとなメニュー ----------

  function openAdult() {
    newAdultQuestion();
    $('adult-error').hidden = true;
    $('adult-lock').hidden = false;
    $('adult-menu').hidden = true;
    $('adult-modal').hidden = false;
  }

  function newAdultQuestion() {
    var q = Problems.adultQuestion();
    state.adultAnswer = q.answer;
    $('adult-question').textContent = q.a + ' × ' + q.b + ' ＝ ？';
    $('adult-answer').value = '';
  }

  function onAdultSubmit() {
    var value = $('adult-answer').value.trim();
    if (value !== '' && Number(value) === state.adultAnswer) {
      $('adult-lock').hidden = true;
      $('adult-menu').hidden = false;
      $('adult-name').value = state.data.childName;
      $('adult-katakana').checked = state.data.settings.showKatakana;
      $('adult-bgm').checked = state.data.settings.bgm;
      $('adult-sfx').checked = state.data.settings.sfx;
      $('adult-name-error').hidden = true;
      $('adult-name-ok').hidden = true;
      $('adult-confirm').hidden = true;
      $('adult-reset-area').hidden = false;
      return;
    }
    $('adult-error').hidden = false;
    newAdultQuestion();
  }

  function onAdultNameSave() {
    var name = SaveData.cleanName($('adult-name').value);
    $('adult-name-ok').hidden = true;
    if (name === '') {
      $('adult-name-error').hidden = false;
      return;
    }
    $('adult-name-error').hidden = true;
    state.data.childName = name;
    persist();
    $('adult-name').value = name;
    $('adult-name-ok').hidden = false;
    renderHome();
  }

  function onAdultReset() {
    SaveData.clear();
    state.data = SaveData.defaultData();
    state.closetSlot = 'clothes';
    applySound();
    closeAdult();
    showScreen('title');
  }

  function closeAdult() {
    $('adult-modal').hidden = true;
    document.activeElement && document.activeElement.blur();
  }

  // ---------- つなぎこみ ----------

  var renderers = {
    title: renderTitle,
    home: renderHome,
    quiz: renderQuiz,
    kokugo: renderKokugo,
    eigo: renderEigo,
    result: renderResult,
    reward: renderReward,
    closet: renderCloset
  };

  function bind(id, handler) {
    $(id).addEventListener('click', handler);
  }

  function init() {
    var loaded = SaveData.load();
    state.data = loaded.data;
    if (loaded.status === 'broken') persist();
    applySound();

    // ボタンを押したら「ポッ」
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (btn && !btn.disabled) Sound.play('tap');
    });
    bind('bgm-btn', function () { setSoundSetting('bgm', !state.data.settings.bgm); });
    $('adult-bgm').addEventListener('change', function () { setSoundSetting('bgm', $('adult-bgm').checked); });
    $('adult-sfx').addEventListener('change', function () { setSoundSetting('sfx', $('adult-sfx').checked); });

    bind('start-btn', onStart);
    $('name-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') onStart();
    });

    bind('go-quiz', startQuiz);
    bind('go-kokugo', startKokugo);
    bind('go-closet', function () { showScreen('closet'); });
    bind('dev-levelup', function () { onDevLevelUp('sansu'); });
    bind('dev-levelup-kokugo', function () { onDevLevelUp('kokugo'); });
    bind('dev-levelup-eigo', function () { onDevLevelUp('eigo'); });
    bind('go-eigo', startEigo);
    bind('adult-btn', openAdult);

    $('keypad').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-key]');
      if (btn) pressKey(btn.getAttribute('data-key'));
    });
    bind('feedback-next', onFeedbackNext);
    bind('quiz-quit', quitQuiz);
    bind('kokugo-quit', quitQuiz);
    bind('eigo-quit', function () {
      Speech.stop();
      quitQuiz();
    });
    bind('eigo-speak', speakCurrent);
    bind('eigo-listen-again', speakCurrent);
    bind('eigo-said', nextEigo);
    $('eigo-choices').addEventListener('click', onEigoChoice);
    $('adult-katakana').addEventListener('change', function () {
      state.data.settings.showKatakana = $('adult-katakana').checked;
      persist();
    });
    $('kokugo-choices').addEventListener('click', onChoice);

    // パソコンで確認するとき用に、キーボードでも答えられるようにする
    document.addEventListener('keydown', function (e) {
      if (state.screen !== 'quiz' || !$('adult-modal').hidden) return;
      if (/^[0-9]$/.test(e.key)) pressKey(e.key);
      else if (e.key === 'Backspace') pressKey('clear');
      else if (e.key === 'Enter') {
        if (!$('feedback-next').hidden && !$('quiz-feedback').hidden) onFeedbackNext();
        else pressKey('ok');
      }
    });

    bind('result-reward', function () { showScreen('reward'); });
    bind('result-again', function () {
      var subject = state.quiz && state.quiz.subject;
      if (subject === 'kokugo') startKokugo();
      else if (subject === 'eigo') startEigo();
      else startQuiz();
    });
    bind('result-home', function () { showScreen('home'); });
    bind('reward-closet', onRewardCloset);
    bind('reward-home', function () { showScreen('home'); });

    $('screen-closet').addEventListener('click', onClosetClick);
    bind('closet-home', function () { showScreen('home'); });

    bind('adult-submit', onAdultSubmit);
    $('adult-answer').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') onAdultSubmit();
    });
    bind('adult-cancel', closeAdult);
    bind('adult-close', closeAdult);
    bind('adult-name-save', onAdultNameSave);
    bind('adult-reset', function () {
      $('adult-reset-area').hidden = true;
      $('adult-confirm').hidden = false;
    });
    bind('adult-confirm-no', function () {
      $('adult-confirm').hidden = true;
      $('adult-reset-area').hidden = false;
    });
    bind('adult-confirm-yes', onAdultReset);

    showScreen('title');

    // インターネットなしでも動くようにする（公開先の https のときだけ。パソコンでの確認中は古いファイルが残らないよう使わない）
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(function () { /* 失敗しても遊べる */ });
    }
  }

  init();
})();
