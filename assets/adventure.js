/*
 * Choose-your-own-adventure engine for the R code-literacy primer.
 *
 * Renders a branching conversation with a (scripted) AI analyst into the
 * #adventure element. The story graph lives in window.ADVENTURE (see
 * adventure-story.js): nodes keyed by id, each with optional narration
 * (`note`), an AI message (`say`), a code block (`code`), an output block
 * (`output`), and either `choices` or an `ending`.
 *
 * The student's path is stored in localStorage so progress survives
 * navigation and reloads; Rewind pops one choice, Start over clears.
 * Flags set by choices are recomputed on replay and shown at endings.
 */
(function () {
  "use strict";

  var story = window.ADVENTURE;
  var root = document.getElementById("adventure");
  if (!story || !root) return;

  var KEY = "r-primer-adventure-" + (story.version || "v1");

  function loadPath() {
    try {
      var p = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(p)) return p;
    } catch (e) { /* fall through */ }
    return [];
  }
  function savePath() {
    try { localStorage.setItem(KEY, JSON.stringify(path)); } catch (e) {}
  }

  var path = loadPath();

  /* ---------------------------------------------------------- formatting -- */

  function escapeHTML(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function fmt(text) {
    return escapeHTML(text)
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
      .split(/\n{2,}/)
      .map(function (p) { return "<p>" + p.replace(/\n/g, "<br>") + "</p>"; })
      .join("");
  }

  /* ----------------------------------------------------------------- DOM -- */

  root.innerHTML =
    '<div class="adv-controls">' +
    '  <button type="button" class="adv-ctl" data-act="rewind">&#8617; Rewind one choice</button>' +
    '  <button type="button" class="adv-ctl" data-act="restart">Start over</button>' +
    '</div>' +
    '<div class="adv-transcript"></div>' +
    '<div class="adv-choices"></div>';

  var transcript = root.querySelector(".adv-transcript");
  var choicesBox = root.querySelector(".adv-choices");

  function aiBubble(node) {
    var wrap = document.createElement("div");
    wrap.className = "adv-turn adv-turn-ai";
    var html = "";
    if (node.note) html += '<div class="adv-note">' + fmt(node.note) + "</div>";
    var bubble = "";
    if (node.say) bubble += fmt(node.say);
    if (node.code) bubble += '<pre class="adv-code">' + escapeHTML(node.code) + "</pre>";
    if (node.output) bubble += '<pre class="adv-output">' + escapeHTML(node.output) + "</pre>";
    if (node.after) bubble += fmt(node.after);
    if (bubble) {
      html +=
        '<div class="adv-bubble adv-bubble-ai"><span class="adv-speaker">' +
        escapeHTML(story.aiName || "AI") + "</span>" + bubble + "</div>";
    }
    wrap.innerHTML = html;
    return wrap;
  }

  function youBubble(text) {
    var wrap = document.createElement("div");
    wrap.className = "adv-turn adv-turn-you";
    wrap.innerHTML =
      '<div class="adv-bubble adv-bubble-you"><span class="adv-speaker">You</span>' +
      fmt(text) + "</div>";
    return wrap;
  }

  function endingBox(node, flags) {
    var box = document.createElement("div");
    box.className = "adv-ending";
    var html = '<div class="adv-ending-title">' + escapeHTML(node.ending.title) + "</div>";
    html += fmt(node.ending.text);
    var caught = Object.keys(story.flagLabels || {}).filter(function (f) { return flags[f]; });
    if (caught.length) {
      html += '<div class="adv-flags"><strong>What you caught along the way:</strong><ul>' +
        caught.map(function (f) { return "<li>&#10003; " + escapeHTML(story.flagLabels[f]) + "</li>"; }).join("") +
        "</ul></div>";
    }
    html += '<p class="adv-replay-hint">There are several other endings — rewind or start over to find them.</p>';
    box.innerHTML = html;
    return box;
  }

  /* -------------------------------------------------------------- replay -- */

  function render() {
    transcript.innerHTML = "";
    choicesBox.innerHTML = "";
    var flags = {};
    var node = story.nodes[story.start];
    transcript.appendChild(aiBubble(node));

    for (var i = 0; i < path.length; i++) {
      var choice = (node.choices || [])[path[i]];
      if (!choice) { path = path.slice(0, i); savePath(); break; }
      (choice.flags || []).forEach(function (f) { flags[f] = true; });
      transcript.appendChild(youBubble(choice.label));
      node = story.nodes[choice.to];
      if (!node) { path = path.slice(0, i); savePath(); node = story.nodes[story.start]; break; }
      transcript.appendChild(aiBubble(node));
    }

    if (node.ending) {
      transcript.appendChild(endingBox(node, flags));
    } else {
      (node.choices || []).forEach(function (c, idx) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "adv-choice";
        b.innerHTML = fmt(c.label);
        b.addEventListener("click", function () {
          path.push(idx);
          savePath();
          render();
        });
        choicesBox.appendChild(b);
      });
    }

    var last = transcript.lastElementChild;
    if (path.length > 0 && last && last.scrollIntoView) {
      last.scrollIntoView({ block: "nearest" });
    }
  }

  root.querySelector(".adv-controls").addEventListener("click", function (ev) {
    var act = ev.target.getAttribute("data-act");
    if (act === "rewind" && path.length > 0) {
      path.pop();
      savePath();
      render();
    }
    if (act === "restart" && (path.length === 0 || window.confirm("Start the scenario over?"))) {
      path = [];
      savePath();
      render();
    }
  });

  render();
})();
