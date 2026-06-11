/*
 * Interactive exercise components for the R code-literacy primer.
 *
 * Two components, both authored in plain Quarto markdown:
 *
 * 1. Multiple choice — a fenced div with class .mcq containing a markdown
 *    task list. The checked item is the correct answer. Text after an
 *    em dash (" — ") in an option becomes per-option feedback shown after
 *    the student checks their answer. An optional nested div with class
 *    .mcq-explanation is revealed once the question is answered correctly.
 *
 *    ::: {.mcq}
 *    **Which verb keeps certain rows?**
 *
 *    - [ ] `select()` — keeps certain *columns*, not rows.
 *    - [x] `filter()` — right: the condition decides which rows survive.
 *    :::
 *
 * 2. AI-checked free response — a fenced div with class .free-response and a
 *    question-id attribute. Nested .model-answer and .grading-notes divs are
 *    hidden from the page and sent to the feedback endpoint as the rubric.
 *    If no endpoint is configured (window.EXERCISE_CONFIG.aiFeedbackUrl),
 *    the component falls back to self-check against the model answer.
 *
 *    ::: {.free-response question-id="unit1-pipeline"}
 *    **In plain English, what does this pipeline do?**
 *    ::: {.model-answer}
 *    ...
 *    :::
 *    ::: {.grading-notes}
 *    ...
 *    :::
 *    :::
 */
(function () {
  "use strict";

  var config = window.EXERCISE_CONFIG || {};

  /* ---------------------------------------------------------- multiple choice */

  function initMCQ(root, index) {
    var list = root.querySelector("ul.task-list") || root.querySelector("ul");
    if (!list) return;

    var groupName = "mcq-" + index;
    var optionsBox = document.createElement("div");
    optionsBox.className = "mcq-options";

    Array.prototype.forEach.call(list.children, function (li) {
      var checkbox = li.querySelector('input[type="checkbox"]');
      var correct = !!(checkbox && checkbox.checked);
      if (checkbox) checkbox.remove();

      // Pandoc wraps task-list item content in a <label>; unwrap it so we
      // don't end up with a label nested inside our own.
      var container = li.querySelector("label") || li;
      var html = container.innerHTML;
      var labelHTML = html;
      var feedbackHTML = "";
      var dash = html.indexOf("—");
      if (dash !== -1) {
        labelHTML = html.slice(0, dash);
        feedbackHTML = html.slice(dash + 1);
      }

      var label = document.createElement("label");
      label.className = "mcq-option";
      label.dataset.correct = correct ? "1" : "0";

      var radio = document.createElement("input");
      radio.type = "radio";
      radio.name = groupName;

      var text = document.createElement("span");
      text.className = "mcq-option-label";
      text.innerHTML = labelHTML;

      label.appendChild(radio);
      label.appendChild(text);

      if (feedbackHTML.trim()) {
        var fb = document.createElement("span");
        fb.className = "mcq-option-feedback";
        fb.innerHTML = feedbackHTML;
        fb.hidden = true;
        label.appendChild(fb);
      }

      optionsBox.appendChild(label);
    });

    list.replaceWith(optionsBox);

    var button = document.createElement("button");
    button.type = "button";
    button.className = "exercise-btn";
    button.textContent = "Check answer";

    var result = document.createElement("span");
    result.className = "mcq-result";

    var explanation = root.querySelector(".mcq-explanation");
    if (explanation) explanation.hidden = true;

    root.appendChild(button);
    root.appendChild(result);

    function clearMarks() {
      optionsBox.querySelectorAll(".mcq-option").forEach(function (opt) {
        opt.classList.remove("is-correct", "is-incorrect");
        var fb = opt.querySelector(".mcq-option-feedback");
        if (fb) fb.hidden = true;
      });
      result.textContent = "";
      result.className = "mcq-result";
    }

    optionsBox.addEventListener("change", clearMarks);

    button.addEventListener("click", function () {
      clearMarks();
      var selectedRadio = optionsBox.querySelector("input:checked");
      if (!selectedRadio) {
        result.textContent = "Pick an answer first.";
        return;
      }
      var option = selectedRadio.closest(".mcq-option");
      var correct = option.dataset.correct === "1";
      var fb = option.querySelector(".mcq-option-feedback");
      if (fb) fb.hidden = false;

      if (correct) {
        option.classList.add("is-correct");
        result.textContent = "✓ Correct";
        result.classList.add("is-correct");
        optionsBox.querySelectorAll("input").forEach(function (r) { r.disabled = true; });
        button.disabled = true;
        if (explanation) explanation.hidden = false;
      } else {
        option.classList.add("is-incorrect");
        result.textContent = "✗ Not quite — try again";
        result.classList.add("is-incorrect");
      }
    });
  }

  /* ------------------------------------------------------------ free response */

  function initFreeResponse(root) {
    var questionId = root.dataset.questionId || "";
    var modelAnswerEl = root.querySelector(".model-answer");
    var gradingNotesEl = root.querySelector(".grading-notes");
    var modelAnswer = modelAnswerEl ? modelAnswerEl.innerText.trim() : "";
    var gradingNotes = gradingNotesEl ? gradingNotesEl.innerText.trim() : "";

    // The visible question text is everything except the hidden rubric divs.
    var clone = root.cloneNode(true);
    clone.querySelectorAll(".model-answer, .grading-notes").forEach(function (el) { el.remove(); });
    var questionText = clone.innerText.trim();

    var textarea = document.createElement("textarea");
    textarea.placeholder = "Write your answer in plain English…";

    var status = document.createElement("span");
    status.className = "fr-status";

    var output = document.createElement("div");

    root.appendChild(textarea);

    if (config.aiFeedbackUrl) {
      var aiButton = document.createElement("button");
      aiButton.type = "button";
      aiButton.className = "exercise-btn";
      aiButton.textContent = "Get feedback";
      root.appendChild(aiButton);

      aiButton.addEventListener("click", function () {
        var answer = textarea.value.trim();
        if (answer.length < 15) {
          status.textContent = "Write a sentence or two first.";
          return;
        }
        aiButton.disabled = true;
        status.textContent = "Checking your answer…";
        fetch(config.aiFeedbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: questionId,
            question: questionText,
            modelAnswer: modelAnswer,
            gradingNotes: gradingNotes,
            answer: answer
          })
        })
          .then(function (resp) {
            if (!resp.ok) throw new Error("HTTP " + resp.status);
            return resp.json();
          })
          .then(function (data) {
            status.textContent = "";
            renderFeedback(output, data);
          })
          .catch(function () {
            status.textContent = "Couldn't reach the feedback service — use “Show model answer” to self-check.";
          })
          .finally(function () {
            aiButton.disabled = false;
          });
      });
    }

    if (modelAnswer) {
      var revealButton = document.createElement("button");
      revealButton.type = "button";
      revealButton.className = "exercise-btn exercise-btn-secondary";
      revealButton.textContent = "Show model answer";
      root.appendChild(revealButton);

      revealButton.addEventListener("click", function () {
        var box = document.createElement("div");
        box.className = "fr-model-answer";
        var label = document.createElement("span");
        label.className = "fr-model-label";
        label.textContent = "Model answer";
        var body = document.createElement("div");
        body.textContent = modelAnswer;
        box.appendChild(label);
        box.appendChild(body);
        output.innerHTML = "";
        output.appendChild(box);
        revealButton.disabled = true;
      });
    }

    root.appendChild(status);
    root.appendChild(output);
  }

  var VERDICT_LABELS = {
    strong: "✓ Strong answer",
    partial: "◐ Partly there",
    needs_work: "✗ Needs another look"
  };

  function renderFeedback(output, data) {
    var verdict = data && VERDICT_LABELS.hasOwnProperty(data.verdict) ? data.verdict : "partial";
    var box = document.createElement("div");
    box.className = "fr-feedback verdict-" + verdict;
    var label = document.createElement("span");
    label.className = "fr-verdict-label";
    label.textContent = VERDICT_LABELS[verdict];
    var body = document.createElement("div");
    body.textContent = (data && data.feedback) || "";
    box.appendChild(label);
    box.appendChild(body);
    output.innerHTML = "";
    output.appendChild(box);
  }

  /* -------------------------------------------------------------------- init */

  function init() {
    document.querySelectorAll(".mcq").forEach(initMCQ);
    document.querySelectorAll(".free-response").forEach(initFreeResponse);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
