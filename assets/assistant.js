/*
 * Tutoring assistant sidebar for the R code-literacy primer.
 *
 * A floating button on every page opens a chat panel that talks to the
 * /chat endpoint of the AI worker (window.EXERCISE_CONFIG.aiFeedbackUrl).
 * The conversation is stored in localStorage so it persists as the student
 * moves between unit pages, and can be copied to the clipboard in full.
 * If no worker URL is configured, the assistant doesn't render at all.
 */
(function () {
  "use strict";

  var config = window.EXERCISE_CONFIG || {};
  if (!config.aiFeedbackUrl) return;

  var ENDPOINT = config.aiFeedbackUrl.replace(/\/+$/, "") + "/chat";
  var STORAGE_KEY = "r-primer-assistant-v1";
  var MAX_STORED_MESSAGES = 40; // kept in localStorage
  var MAX_SENT_MESSAGES = 16;   // sent to the worker per request

  var GREETING =
    "Hi! I'm the primer's helper. Stuck on a question, or is something on this " +
    "page just not clicking? Tell me where you are and what you've tried — " +
    "I'll point you in the right direction (without spoiling the answers).";

  /* ------------------------------------------------------------- storage -- */

  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (s && Array.isArray(s.messages)) return s;
    } catch (e) { /* fall through */ }
    return { messages: [], open: false };
  }

  function saveState() {
    try {
      state.messages = state.messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage full or blocked — chat still works this page */ }
  }

  var state = loadState();

  /* ----------------------------------------------------------- rendering -- */

  function escapeHTML(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Minimal formatting: paragraphs, `code`, **bold**.
  function formatMessage(text) {
    return escapeHTML(text)
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
      .split(/\n{2,}/)
      .map(function (p) { return "<p>" + p.replace(/\n/g, "<br>") + "</p>"; })
      .join("");
  }

  function messageBubble(role, text) {
    var div = document.createElement("div");
    div.className = "assistant-msg assistant-msg-" + role;
    div.innerHTML = formatMessage(text);
    return div;
  }

  /* ----------------------------------------------------------------- DOM -- */

  var toggle = document.createElement("button");
  toggle.type = "button";
  toggle.id = "assistant-toggle";
  toggle.setAttribute("aria-label", "Open the help assistant");
  toggle.innerHTML = "&#x1F4AC;"; // speech balloon

  var panel = document.createElement("div");
  panel.id = "assistant-panel";
  panel.hidden = true;
  panel.innerHTML =
    '<div class="assistant-header">' +
    '  <span class="assistant-title">Primer helper</span>' +
    '  <span class="assistant-actions">' +
    '    <button type="button" class="assistant-btn" data-action="copy" title="Copy the whole conversation">Copy</button>' +
    '    <button type="button" class="assistant-btn" data-action="clear" title="Start over">Clear</button>' +
    '    <button type="button" class="assistant-btn" data-action="close" aria-label="Close">&#x2715;</button>' +
    '  </span>' +
    '</div>' +
    '<div class="assistant-messages"></div>' +
    '<form class="assistant-form">' +
    '  <textarea rows="2" placeholder="Ask about anything on this site…" aria-label="Message the assistant"></textarea>' +
    '  <button type="submit" class="assistant-send">Send</button>' +
    '</form>' +
    '<div class="assistant-footnote">AI helper — it can make mistakes. Conversations stay in this browser.</div>';

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  var messagesBox = panel.querySelector(".assistant-messages");
  var form = panel.querySelector(".assistant-form");
  var textarea = panel.querySelector("textarea");
  var sendButton = panel.querySelector(".assistant-send");

  function renderAll() {
    messagesBox.innerHTML = "";
    messagesBox.appendChild(messageBubble("assistant", GREETING));
    state.messages.forEach(function (m) {
      messagesBox.appendChild(messageBubble(m.role, m.content));
    });
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  function setOpen(open) {
    state.open = open;
    panel.hidden = !open;
    toggle.classList.toggle("assistant-open", open);
    saveState();
    if (open) {
      renderAll();
      textarea.focus();
    }
  }

  /* ------------------------------------------------------------ chatting -- */

  var pending = false;

  function send() {
    var text = textarea.value.trim();
    if (!text || pending) return;
    textarea.value = "";

    state.messages.push({ role: "user", content: text });
    saveState();
    messagesBox.appendChild(messageBubble("user", text));

    var typing = document.createElement("div");
    typing.className = "assistant-msg assistant-msg-assistant assistant-typing";
    typing.textContent = "…";
    messagesBox.appendChild(typing);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    pending = true;
    sendButton.disabled = true;

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: state.messages.slice(-MAX_SENT_MESSAGES),
        page: document.title,
      }),
    })
      .then(function (resp) {
        return resp
          .json()
          .catch(function () { return {}; })
          .then(function (data) {
            if (!resp.ok) {
              var detail = (data && (data.detail || data.error)) || "";
              throw new Error("HTTP " + resp.status + (detail ? " — " + detail : ""));
            }
            return data;
          });
      })
      .then(function (data) {
        var reply = (data && data.reply) || "";
        state.messages.push({ role: "assistant", content: reply });
        saveState();
        typing.remove();
        messagesBox.appendChild(messageBubble("assistant", reply));
        messagesBox.scrollTop = messagesBox.scrollHeight;
      })
      .catch(function (err) {
        typing.remove();
        var note = document.createElement("div");
        note.className = "assistant-msg assistant-msg-error";
        note.textContent =
          "Sorry — I couldn't reach the assistant (" +
          (err && err.message ? err.message : "network error") +
          "). Try again in a moment.";
        messagesBox.appendChild(note);
        messagesBox.scrollTop = messagesBox.scrollHeight;
      })
      .finally(function () {
        pending = false;
        sendButton.disabled = false;
      });
  }

  /* ------------------------------------------------------ copy and clear -- */

  function transcript() {
    var lines = [
      "Reading R Code — assistant conversation",
      "Saved: " + new Date().toLocaleString(),
      "",
    ];
    state.messages.forEach(function (m) {
      lines.push((m.role === "user" ? "Me: " : "Helper: ") + m.content);
      lines.push("");
    });
    return lines.join("\n");
  }

  function copyConversation(button) {
    if (state.messages.length === 0) {
      flash(button, "Nothing yet");
      return;
    }
    var text = transcript();
    var done = function () { flash(button, "Copied!"); };
    var fail = function () { flash(button, "Couldn't copy"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fail);
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? done() : fail(); }
      catch (e) { fail(); }
      ta.remove();
    }
  }

  function flash(button, label) {
    var original = button.textContent;
    button.textContent = label;
    setTimeout(function () { button.textContent = original; }, 1500);
  }

  /* -------------------------------------------------------------- wiring -- */

  toggle.addEventListener("click", function () { setOpen(panel.hidden); });

  panel.querySelector(".assistant-actions").addEventListener("click", function (ev) {
    var action = ev.target.getAttribute("data-action");
    if (action === "close") setOpen(false);
    if (action === "copy") copyConversation(ev.target);
    if (action === "clear") {
      if (state.messages.length === 0 || window.confirm("Clear this conversation?")) {
        state.messages = [];
        saveState();
        renderAll();
      }
    }
  });

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    send();
  });

  textarea.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      send();
    }
  });

  // Restore open state from the previous page.
  if (state.open) setOpen(true);
})();
