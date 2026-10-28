(function () {
  "use strict";

  const TOTAL_TEST_QUESTIONS = 46;
  const PASSING_SCORE = 38;
  const LETTERS = ["A", "B", "C", "D"];

  const state = {
    bank: Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [],
    testQuestions: [],
    userAnswers: {}, // questionIndex -> selectedOptionIndex
    currentIndex: 0,
    startTimeMs: 0,
    elapsedSeconds: 0,
    timerId: null,
    sectionStats: []
  };

  // DOM Elements
  const els = {
    bankCount: document.getElementById("bank-count"),
    startSectionsList: document.getElementById("start-sections-list"),
    startTestBtn: document.getElementById("start-test-btn"),
    restartTopBtn: document.getElementById("restart-top-btn"),
    themeToggleBtn: document.getElementById("theme-toggle-btn"),
    themeIcon: document.getElementById("theme-icon"),
    themeLabel: document.getElementById("theme-label"),
    liveTimer: document.getElementById("live-timer"),

    startView: document.getElementById("start-view"),
    quizView: document.getElementById("quiz-view"),
    resultsView: document.getElementById("results-view"),

    questionCounter: document.getElementById("question-counter"),
    answeredCounter: document.getElementById("answered-counter"),
    quizProgress: document.getElementById("quiz-progress"),
    questionSectionBadge: document.getElementById("question-section-badge"),
    questionStatusBadge: document.getElementById("question-status-badge"),
    questionText: document.getElementById("question-text"),
    optionsContainer: document.getElementById("options-container"),
    instantFeedbackBox: document.getElementById("instant-feedback-box"),

    prevQuestionBtn: document.getElementById("prev-question-btn"),
    nextQuestionBtn: document.getElementById("next-question-btn"),
    finishTestBtn: document.getElementById("finish-test-btn"),
    sidebarSubmitBtn: document.getElementById("sidebar-submit-btn"),
    questionPalette: document.getElementById("question-palette"),
    unansweredWarning: document.getElementById("unanswered-warning"),

    confirmDialog: document.getElementById("confirm-submit-dialog"),
    dialogMessage: document.getElementById("dialog-message"),

    resultBanner: document.getElementById("result-banner"),
    passFailPill: document.getElementById("pass-fail-pill"),
    resultsHeading: document.getElementById("results-heading"),
    resultSubtitle: document.getElementById("result-subtitle"),
    scoreFraction: document.getElementById("score-fraction"),
    scorePercentage: document.getElementById("score-percentage"),
    missedCount: document.getElementById("missed-count"),
    timeSpent: document.getElementById("time-spent"),
    retakeNewBtn: document.getElementById("retake-new-btn"),

    sectionSortSelect: document.getElementById("section-sort-select"),
    studyRecommendations: document.getElementById("study-recommendations"),
    sectionPerfTbody: document.getElementById("section-perf-tbody"),

    reviewStatusFilter: document.getElementById("review-status-filter"),
    reviewSectionFilter: document.getElementById("review-section-filter"),
    reviewList: document.getElementById("review-list")
  };

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function formatDuration(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    els.themeToggleBtn.setAttribute("aria-pressed", String(isDark));
    els.themeIcon.textContent = isDark ? "\u2600\uFE0F" : "\uD83C\uDF19";
    els.themeLabel.textContent = isDark ? "Light Mode" : "Dark Mode";
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem("ca_dmv_theme");
    } catch (_) {}
    if (saved === "dark" || saved === "light") {
      applyTheme(saved);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      applyTheme("dark");
    } else {
      applyTheme("light");
    }
  }

  function toggleTheme() {
    const currentIsDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    const next = currentIsDark ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem("ca_dmv_theme", next);
    } catch (_) {}
  }

  function initStartScreen() {
    els.startView.hidden = false;
    els.quizView.hidden = true;
    els.resultsView.hidden = true;
    els.liveTimer.hidden = true;
    els.restartTopBtn.hidden = true;
    els.bankCount.textContent = String(state.bank.length);

    // Group bank by sectionId
    const map = new Map();
    for (const q of state.bank) {
      if (!map.has(q.sectionId)) {
        map.set(q.sectionId, {
          sectionId: q.sectionId,
          sectionTitle: q.sectionTitle,
          count: 0
        });
      }
      map.get(q.sectionId).count += 1;
    }

    const sortedSections = Array.from(map.values()).sort(
      (a, b) => a.sectionId - b.sectionId
    );

    els.startSectionsList.innerHTML = "";
    for (const sec of sortedSections) {
      const li = document.createElement("li");
      const titleSpan = document.createElement("span");
      titleSpan.textContent = sec.sectionTitle;
      const badge = document.createElement("span");
      badge.className = "sec-count-badge";
      badge.textContent = sec.count + " Qs";
      li.appendChild(titleSpan);
      li.appendChild(badge);
      els.startSectionsList.appendChild(li);
    }
  }

  function startNewTest() {
    if (state.bank.length < TOTAL_TEST_QUESTIONS) {
      alert("Question bank has fewer than 46 questions.");
      return;
    }

    state.testQuestions = shuffleArray(state.bank).slice(0, TOTAL_TEST_QUESTIONS);
    state.userAnswers = {};
    state.currentIndex = 0;

    // Timer setup
    stopTimer();
    state.startTimeMs = Date.now();
    state.elapsedSeconds = 0;
    els.liveTimer.textContent = "00:00";
    els.liveTimer.hidden = false;
    els.restartTopBtn.hidden = false;

    state.timerId = setInterval(() => {
      state.elapsedSeconds = Math.floor((Date.now() - state.startTimeMs) / 1000);
      els.liveTimer.textContent = formatDuration(state.elapsedSeconds);
    }, 1000);

    // Switch views
    els.startView.hidden = true;
    els.resultsView.hidden = true;
    els.quizView.hidden = false;

    renderPalette();
    renderCurrentQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function renderPalette() {
    els.questionPalette.innerHTML = "";
    for (let i = 0; i < TOTAL_TEST_QUESTIONS; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "palette-btn";
      btn.textContent = String(i + 1);
      btn.setAttribute("aria-label", "Go to question " + (i + 1));
      btn.addEventListener("click", () => {
        state.currentIndex = i;
        renderCurrentQuestion();
      });
      els.questionPalette.appendChild(btn);
    }
    updatePaletteStates();
  }

  function updatePaletteStates() {
    const answeredIndices = Object.keys(state.userAnswers);
    const answeredCount = answeredIndices.length;
    let correctCount = 0;
    let incorrectCount = 0;

    answeredIndices.forEach((idxStr) => {
      const i = Number(idxStr);
      if (state.userAnswers[i] === state.testQuestions[i].correctIndex) {
        correctCount += 1;
      } else {
        incorrectCount += 1;
      }
    });

    els.answeredCounter.textContent =
      answeredCount +
      " / " +
      TOTAL_TEST_QUESTIONS +
      " Answered (" +
      correctCount +
      " Correct \u2022 " +
      incorrectCount +
      " Incorrect)";
    els.quizProgress.value = answeredCount;

    const remaining = TOTAL_TEST_QUESTIONS - answeredCount;
    els.unansweredWarning.textContent =
      remaining === 0
        ? "All 46 questions answered! Ready to grade."
        : remaining + " question" + (remaining === 1 ? "" : "s") + " remaining.";

    const buttons = els.questionPalette.querySelectorAll(".palette-btn");
    buttons.forEach((btn, idx) => {
      const ans = state.userAnswers[idx];
      const hasAnswer = ans !== undefined;
      const isCorrect = hasAnswer && ans === state.testQuestions[idx].correctIndex;

      btn.classList.toggle("is-current", idx === state.currentIndex);
      btn.classList.toggle("is-correct", hasAnswer && isCorrect);
      btn.classList.toggle("is-incorrect", hasAnswer && !isCorrect);
    });
  }

  function renderCurrentQuestion() {
    const idx = state.currentIndex;
    const q = state.testQuestions[idx];
    const selected = state.userAnswers[idx];

    els.questionCounter.textContent = "Question " + (idx + 1) + " of " + TOTAL_TEST_QUESTIONS;
    els.questionSectionBadge.textContent = q.sectionTitle;
    els.questionText.textContent = idx + 1 + ". " + q.question;

    els.optionsContainer.innerHTML = "";

    q.options.forEach((optText, optIdx) => {
      const inputId = "q-" + idx + "-opt-" + optIdx;
      const label = document.createElement("label");
      label.className = "option-label";
      label.setAttribute("for", inputId);

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.id = inputId;
      radio.name = "currentQuestionOption";
      radio.value = String(optIdx);
      radio.checked = selected === optIdx;

      radio.addEventListener("change", () => {
        state.userAnswers[idx] = optIdx;
        updatePaletteStates();
        applyInstantFeedback(q, optIdx);
      });

      const letterSpan = document.createElement("span");
      letterSpan.className = "option-letter";
      letterSpan.textContent = LETTERS[optIdx] + ".";

      const textSpan = document.createElement("span");
      textSpan.className = "option-text";
      textSpan.textContent = optText;

      label.appendChild(radio);
      label.appendChild(letterSpan);
      label.appendChild(textSpan);
      els.optionsContainer.appendChild(label);
    });

    if (selected !== undefined) {
      applyInstantFeedback(q, selected);
    } else {
      els.instantFeedbackBox.hidden = true;
      els.instantFeedbackBox.textContent = "";
      els.questionStatusBadge.hidden = true;
      els.questionStatusBadge.textContent = "";
    }

    els.prevQuestionBtn.disabled = idx === 0;
    els.nextQuestionBtn.hidden = idx === TOTAL_TEST_QUESTIONS - 1;
    updatePaletteStates();
  }

  function applyInstantFeedback(q, selectedIdx) {
    const labels = els.optionsContainer.querySelectorAll(".option-label");
    labels.forEach((lbl, idx) => {
      lbl.classList.remove("option-correct", "option-wrong");
      if (idx === q.correctIndex) {
        lbl.classList.add("option-correct");
      } else if (idx === selectedIdx && selectedIdx !== q.correctIndex) {
        lbl.classList.add("option-wrong");
      }
    });

    const isCorrect = selectedIdx === q.correctIndex;
    els.questionStatusBadge.hidden = false;
    els.questionStatusBadge.className =
      "question-status-badge " + (isCorrect ? "is-correct" : "is-incorrect");
    els.questionStatusBadge.textContent = isCorrect ? "\u2713 Correct" : "\u2717 Incorrect";

    els.instantFeedbackBox.hidden = false;
    els.instantFeedbackBox.className =
      "feedback-box " + (isCorrect ? "feedback-correct" : "feedback-wrong");
    els.instantFeedbackBox.innerHTML =
      "<strong>" +
      (isCorrect ? "Correct!" : "Incorrect.") +
      "</strong> " +
      escapeHtml(q.explanation);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function requestSubmitTest() {
    const answeredCount = Object.keys(state.userAnswers).length;
    const unanswered = TOTAL_TEST_QUESTIONS - answeredCount;

    if (unanswered > 0 && typeof els.confirmDialog.showModal === "function") {
      els.dialogMessage.textContent =
        "You still have " +
        unanswered +
        " unanswered question" +
        (unanswered === 1 ? "" : "s") +
        " out of 46. Unanswered questions count as incorrect. Are you sure you want to submit?";
      els.confirmDialog.showModal();
    } else {
      gradeAndShowResults();
    }
  }

  function gradeAndShowResults() {
    stopTimer();
    state.elapsedSeconds = Math.floor((Date.now() - state.startTimeMs) / 1000);
    els.liveTimer.hidden = true;

    let totalCorrect = 0;
    const sectionMap = new Map();

    state.testQuestions.forEach((q, idx) => {
      const userChoice = state.userAnswers[idx];
      const isCorrect = userChoice === q.correctIndex;
      if (isCorrect) {
        totalCorrect += 1;
      }

      if (!sectionMap.has(q.sectionId)) {
        sectionMap.set(q.sectionId, {
          sectionId: q.sectionId,
          sectionTitle: q.sectionTitle,
          correct: 0,
          total: 0
        });
      }
      const entry = sectionMap.get(q.sectionId);
      entry.total += 1;
      if (isCorrect) {
        entry.correct += 1;
      }
    });

    state.sectionStats = Array.from(sectionMap.values()).map((s) => ({
      ...s,
      pct: Math.round((s.correct / s.total) * 100)
    }));

    const passed = totalCorrect >= PASSING_SCORE;
    const missed = TOTAL_TEST_QUESTIONS - totalCorrect;
    const overallPct = ((totalCorrect / TOTAL_TEST_QUESTIONS) * 100).toFixed(1);

    // Populate Banner
    els.resultBanner.classList.toggle("is-failed", !passed);
    els.passFailPill.className = "status-pill " + (passed ? "pass" : "fail");
    els.passFailPill.textContent = passed ? "PASSED (38+ REQUIRED)" : "DID NOT PASS (38 REQUIRED)";

    els.resultsHeading.textContent = passed
      ? "Congratulations! You Passed the California DMV Knowledge Test!"
      : "Keep Practicing — You Need at Least 38 Correct to Pass";

    els.resultSubtitle.textContent = passed
      ? "You answered " +
        totalCorrect +
        " out of 46 questions correctly (" +
        overallPct +
        "%), meeting the California DMV minimum passing score of 38."
      : "You answered " +
        totalCorrect +
        " out of 46 questions correctly (" +
        overallPct +
        "%). You needed " +
        (PASSING_SCORE - totalCorrect) +
        " more correct answer" +
        (PASSING_SCORE - totalCorrect === 1 ? "" : "s") +
        " to reach the passing score of 38.";

    els.scoreFraction.textContent = totalCorrect + " / " + TOTAL_TEST_QUESTIONS;
    els.scorePercentage.textContent = overallPct + "% Accuracy";
    els.missedCount.textContent =
      missed + " Missed (" + (passed ? (8 - missed) + " to spare" : (missed - 8) + " over limit") + ")";
    els.timeSpent.textContent = "Time: " + formatDuration(state.elapsedSeconds);

    // Study recommendations for sections below 83%
    const weakSections = state.sectionStats
      .filter((s) => s.correct / s.total < PASSING_SCORE / TOTAL_TEST_QUESTIONS)
      .sort((a, b) => a.pct - b.pct);

    if (weakSections.length > 0) {
      els.studyRecommendations.hidden = false;
      const names = weakSections.map((s) => s.sectionTitle).join("; ");
      els.studyRecommendations.innerHTML =
        "<strong>Recommended Handbook Sections to Review (&lt; 83%):</strong> " +
        escapeHtml(names);
    } else {
      els.studyRecommendations.hidden = false;
      els.studyRecommendations.innerHTML =
        "<strong>Outstanding!</strong> You scored above the 83% passing standard in every handbook section tested.";
    }

    // Populate Section Filter in Review
    els.reviewSectionFilter.innerHTML = '<option value="all">All Sections</option>';
    const byId = state.sectionStats.slice().sort((a, b) => a.sectionId - b.sectionId);
    for (const sec of byId) {
      const opt = document.createElement("option");
      opt.value = String(sec.sectionId);
      opt.textContent = sec.sectionTitle + " (" + sec.correct + "/" + sec.total + ")";
      els.reviewSectionFilter.appendChild(opt);
    }

    els.sectionSortSelect.value = "section";
    els.reviewStatusFilter.value = "all";
    els.reviewSectionFilter.value = "all";

    renderSectionPerformanceTable();
    renderReviewList();

    els.quizView.hidden = true;
    els.resultsView.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderSectionPerformanceTable() {
    const sortMode = els.sectionSortSelect.value;
    const rows = state.sectionStats.slice();

    if (sortMode === "lowest") {
      rows.sort((a, b) => a.pct - b.pct || a.sectionId - b.sectionId);
    } else if (sortMode === "highest") {
      rows.sort((a, b) => b.pct - a.pct || a.sectionId - b.sectionId);
    } else {
      rows.sort((a, b) => a.sectionId - b.sectionId);
    }

    els.sectionPerfTbody.innerHTML = "";

    for (const s of rows) {
      const tr = document.createElement("tr");

      let statusLabel = "Passing (83%+)";
      let badgeClass = "badge-strong";
      let barColor = "#157347";

      if (s.pct < 65) {
        statusLabel = "Needs Study";
        badgeClass = "badge-weak";
        barColor = "#b02a37";
      } else if (s.pct < 83) {
        statusLabel = "Borderline";
        badgeClass = "badge-warn";
        barColor = "#d9822b";
      }

      tr.innerHTML =
        "<td><strong>" +
        escapeHtml(s.sectionTitle) +
        "</strong></td>" +
        "<td><strong>" +
        s.correct +
        "</strong> / " +
        s.total +
        "</td>" +
        "<td><strong>" +
        s.pct +
        "%</strong></td>" +
        '<td><div class="sec-bar-track" aria-hidden="true"><div class="sec-bar-fill" style="width: ' +
        s.pct +
        "%; background-color: " +
        barColor +
        ';"></div></div></td>' +
        '<td><span class="sec-badge ' +
        badgeClass +
        '">' +
        statusLabel +
        "</span></td>" +
        '<td><button type="button" class="btn-link-filter" data-sec-id="' +
        s.sectionId +
        '">Filter Qs</button></td>';

      const filterBtn = tr.querySelector(".btn-link-filter");
      filterBtn.addEventListener("click", () => {
        els.reviewSectionFilter.value = String(s.sectionId);
        renderReviewList();
        document
          .getElementById("question-review-section")
          .scrollIntoView({ behavior: "smooth" });
      });

      els.sectionPerfTbody.appendChild(tr);
    }
  }

  function renderReviewList() {
    const statusMode = els.reviewStatusFilter.value;
    const secFilter = els.reviewSectionFilter.value;

    els.reviewList.innerHTML = "";
    let shown = 0;

    state.testQuestions.forEach((q, idx) => {
      const userChoice = state.userAnswers[idx];
      const isCorrect = userChoice === q.correctIndex;

      if (statusMode === "incorrect" && isCorrect) return;
      if (statusMode === "correct" && !isCorrect) return;
      if (secFilter !== "all" && String(q.sectionId) !== secFilter) return;

      shown += 1;
      const item = document.createElement("article");
      item.className = "review-item" + (isCorrect ? "" : " is-wrong");

      const userAnswerText =
        userChoice !== undefined
          ? LETTERS[userChoice] + ". " + q.options[userChoice]
          : "No answer selected (Unanswered)";

      const correctAnswerText =
        LETTERS[q.correctIndex] + ". " + q.options[q.correctIndex];

      item.innerHTML =
        '<div class="review-item-top">' +
        '<span class="review-q-num">Question ' +
        (idx + 1) +
        " &bull; " +
        (isCorrect ? "Correct" : "Incorrect") +
        "</span>" +
        '<span class="section-tag">' +
        escapeHtml(q.sectionTitle) +
        "</span>" +
        "</div>" +
        '<p class="review-q-text">' +
        escapeHtml(q.question) +
        "</p>" +
        '<div class="review-answers-compare">' +
        '<div class="ans-box ' +
        (isCorrect ? "user-correct" : "user-wrong") +
        '">' +
        "<strong>Your Answer:</strong><br>" +
        escapeHtml(userAnswerText) +
        "</div>" +
        '<div class="ans-box correct-ref">' +
        "<strong>Correct Handbook Answer:</strong><br>" +
        escapeHtml(correctAnswerText) +
        "</div>" +
        "</div>" +
        '<p class="review-explanation"><strong>Handbook Rule:</strong> ' +
        escapeHtml(q.explanation) +
        "</p>";

      els.reviewList.appendChild(item);
    });

    if (shown === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No questions match the selected filters.";
      els.reviewList.appendChild(empty);
    }
  }

  // Event Listeners
  els.themeToggleBtn.addEventListener("click", toggleTheme);
  els.startTestBtn.addEventListener("click", startNewTest);
  els.restartTopBtn.addEventListener("click", startNewTest);
  els.retakeNewBtn.addEventListener("click", startNewTest);

  els.prevQuestionBtn.addEventListener("click", () => {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1;
      renderCurrentQuestion();
    }
  });

  els.nextQuestionBtn.addEventListener("click", () => {
    if (state.currentIndex < TOTAL_TEST_QUESTIONS - 1) {
      state.currentIndex += 1;
      renderCurrentQuestion();
    }
  });

  els.finishTestBtn.addEventListener("click", requestSubmitTest);
  els.sidebarSubmitBtn.addEventListener("click", requestSubmitTest);

  els.confirmDialog.addEventListener("close", () => {
    if (els.confirmDialog.returnValue === "confirm") {
      gradeAndShowResults();
    }
  });

  els.sectionSortSelect.addEventListener("change", renderSectionPerformanceTable);
  els.reviewStatusFilter.addEventListener("change", renderReviewList);
  els.reviewSectionFilter.addEventListener("change", renderReviewList);

  initTheme();
  initStartScreen();
})();
