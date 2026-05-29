    "use strict";

    var PAGES = [
      ["home", "Home", "H"],
      ["reset", "Mind Reset", "R"],
      ["today", "Today", "T"],
      ["week", "My Week", "W"],
      ["goals", "Goals", "G"],
      ["habits", "Habits", "B"],
      ["affirmations", "Affirmations", "A"],
      ["journal", "Journal", "J"]
    ];
    var MOODS = [
      ["overwhelmed", "Overwhelmed"],
      ["frustrated", "Frustrated"],
      ["drained", "Drained"],
      ["grounded", "Grounded"],
      ["motivated", "Motivated"]
    ];
    var MOOD_RESPONSES = {
      overwhelmed: {
        title: "Let the noise soften.",
        response: "You do not need to solve everything today. Let the noise soften before taking the next step."
      },
      frustrated: {
        title: "Release the pressure.",
        response: "Pressure builds when everything feels urgent. One smaller step is enough right now."
      },
      drained: {
        title: "Care for your energy.",
        response: "Your energy deserves care too. Rest is not falling behind."
      },
      grounded: {
        title: "Protect this steadiness.",
        response: "You are in a steadier place now. Protect this calm with intention."
      },
      motivated: {
        title: "Move with intention.",
        response: "This energy can move something forward. Momentum grows quietly."
      }
    };
    var AFFIRMATIONS = [
      "I can move gently and still move forward.",
      "I do not have to carry every thought at once.",
      "A slower pace is still a valid pace.",
      "My worth is not measured by my output.",
      "I am allowed to begin again without shame.",
      "Small steps are allowed to count.",
      "I can choose peace without abandoning my goals.",
      "Today can be simple and still be meaningful.",
      "I am learning to trust a quieter rhythm.",
      "I can place down what is not mine to hold."
    ];
    var J_PROMPTS = [
      "What felt heavy today?",
      "What do I need more of right now?",
      "What am I proud of today?",
      "What deserves my energy tomorrow?",
      "What can I let go of tonight?",
      "What made me smile today, even briefly?",
      "What would I tell a friend who felt how I feel right now?",
      "What is one thing I did well today?",
      "What do I want tomorrow to feel like?",
      "What am I grateful for in this moment?"
    ];

    var LS = {
      get: function(key, fallback) {
        try {
          var raw = localStorage.getItem("qmb-" + key);
          return raw === null ? fallback : JSON.parse(raw);
        } catch (err) {
          return fallback;
        }
      },
      set: function(key, value) {
        try {
          localStorage.setItem("qmb-" + key, JSON.stringify(value));
          showSaved();
        } catch (err) {
          showSaved();
        }
      }
    };

    var currentAffIdx = LS.get("home-aff-idx", 0);
    var dumps = LS.get("dumps", []);
    var tasks = LS.get("tasks", []);
    var goals = LS.get("goals", []);
    var habits = LS.get("habits", []);
    var completedPriorities = LS.get("completed-priorities", []);
    var currentNextStep = LS.get("current-next-step", null);
    var jPromptIdx = LS.get("j-prompt-idx", new Date().getDate() % J_PROMPTS.length);
    var jEntries = LS.get("j-entries", []);

    function uid() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }
    function escapeHTML(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
    function showSaved() {
      var dot = document.getElementById("save-dot");
      if (!dot) return;
      dot.classList.add("show");
      clearTimeout(showSaved.timer);
      showSaved.timer = setTimeout(function() { dot.classList.remove("show"); }, 700);
    }
    function formatDate(ts) {
      var d = ts ? new Date(ts) : new Date();
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    function buildNav() {
      var top = document.getElementById("top-links");
      var bot = document.getElementById("bot-nav");
      top.innerHTML = PAGES.map(function(p) {
        return '<button class="top-link" type="button" data-nav="' + p[0] + '" onclick="showPage(\'' + p[0] + '\')"><span class="top-glyph">' + p[2] + '</span><span>' + p[1] + '</span></button>';
      }).join("");
      bot.innerHTML = PAGES.map(function(p) {
        return '<button class="bot-link" type="button" data-nav="' + p[0] + '" onclick="showPage(\'' + p[0] + '\')"><span class="b-glyph">' + p[2] + '</span><span class="b-label">' + p[1].replace("Mind ", "").replace("Affirmations", "Affirm") + '</span></button>';
      }).join("");
    }
    function showPage(page) {
      PAGES.forEach(function(p) {
        var id = p[0];
        var section = document.getElementById("page-" + id);
        var links = document.querySelectorAll('[data-nav="' + id + '"]');
        if (section) section.classList.toggle("active", id === page);
        links.forEach(function(link) { link.classList.toggle("active", id === page); });
      });
      if (location.hash !== "#" + page) history.replaceState(null, "", "#" + page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function initFields() {
      document.querySelectorAll(".save-field").forEach(function(el) {
        var key = el.dataset.key;
        el.value = LS.get("field-" + key, "");
        el.addEventListener("input", function() {
          LS.set("field-" + key, el.value);
          updateStats();
          if (el.classList.contains("priority-input")) {
            syncCompletedPriorities();
            updateTodayPath();
            renderCurrentNextStep(false);
          }
        });
      });
      updateTodayPath();
    }
    function initMood() {
      var wrap = document.getElementById("mood-row");
      var active = normalizeMood(LS.get("mood", ""));
      wrap.innerHTML = MOODS.map(function(m) {
        return '<button class="mood-pill ' + (active === m[0] ? "on" : "") + '" type="button" data-mood="' + m[0] + '" aria-pressed="' + (active === m[0] ? "true" : "false") + '" onclick="setMood(\'' + m[0] + '\')"><span class="mood-dot"></span><span class="mood-word">' + m[1] + '</span></button>';
      }).join("");
      updateMoodResponse(active, false);
    }
    function normalizeMood(mood) {
      var legacy = { calm: "grounded", okay: "grounded", stressed: "overwhelmed", tired: "drained", good: "motivated" };
      if (legacy[mood]) {
        LS.set("mood", legacy[mood]);
        return legacy[mood];
      }
      return MOOD_RESPONSES[mood] ? mood : "";
    }
    function setMood(mood) {
      LS.set("mood", mood);
      initMood();
      updateMoodResponse(mood, true);
      initGreeting();
      markUsedToday();
    }
    function initGreeting() {
      var h = new Date().getHours();
      var label = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
      var mood = normalizeMood(LS.get("mood", ""));
      document.getElementById("g-time").textContent = label + " reset";
      document.getElementById("g-text").textContent = mood && MOOD_RESPONSES[mood] ? MOOD_RESPONSES[mood].title : h < 12 ? "A gentle start is enough." : h < 17 ? "Come back to center." : "Let the day soften now.";
    }
    function updateMoodResponse(mood, animate) {
      var el = document.getElementById("mood-response");
      if (!el) return;
      if (!mood || !MOOD_RESPONSES[mood]) {
        el.textContent = "";
        el.classList.remove("show");
        return;
      }
      if (animate) el.classList.remove("show");
      setTimeout(function() {
        el.textContent = MOOD_RESPONSES[mood].response;
        el.classList.add("show");
      }, animate ? 80 : 0);
    }
    function cycleHomeAffirmation() {
      currentAffIdx = (currentAffIdx + 1) % AFFIRMATIONS.length;
      LS.set("home-aff-idx", currentAffIdx);
      renderAffirmation();
    }
    function renderAffirmation() {
      document.getElementById("home-aff").textContent = AFFIRMATIONS[currentAffIdx] || AFFIRMATIONS[0];
    }

    function markUsedToday() {
      var today = new Date().toISOString().slice(0, 10);
      var days = LS.get("used-days", []);
      if (days.indexOf(today) === -1) {
        days.push(today);
        LS.set("used-days", days);
      }
      updateStats();
    }
    function updateStats() {
      var days = LS.get("used-days", []);
      var words = jEntries.reduce(function(total, entry) { return total + wordCount(entry.text); }, 0);
      words += wordCount(LS.get("journal-draft", ""));
      var doneTasks = tasks.filter(function(t) { return t.done; }).length;
      document.getElementById("stat-days").textContent = days.length;
      document.getElementById("stat-tasks").textContent = doneTasks;
      document.getElementById("stat-words").textContent = words;
    }
    function wordCount(text) {
      return String(text || "").trim().split(/\s+/).filter(Boolean).length;
    }

    function addDump() {
      var seed = document.getElementById("dump-seed");
      var now = Date.now();
      dumps.unshift({ id: uid(), created: now, q1: seed.value.trim(), q2: "", q3: "", q4: "", released: false });
      seed.value = "";
      saveDumps();
      renderDumps();
      markUsedToday();
    }
    function saveDumps() { LS.set("dumps", dumps); }
    function dumpIn(id, field, value) {
      var entry = dumps.find(function(x) { return x.id === id; });
      if (entry) { entry[field] = value; saveDumps(); }
    }
    function rmDump(id) {
      var el = document.getElementById("dump-" + id);
      if (el) { el.style.opacity = "0"; el.style.transform = "scale(.98)"; }
      setTimeout(function() {
        dumps = dumps.filter(function(x) { return x.id !== id; });
        saveDumps();
        renderDumps();
      }, 240);
    }
    function lighter(id) {
      var entry = dumps.find(function(x) { return x.id === id; });
      if (!entry) return;
      entry.released = true;
      saveDumps();
      renderDumps();
      markUsedToday();
    }
    function renderDumps() {
      var list = document.getElementById("dump-list");
      if (!dumps.length) {
        list.innerHTML = '<div class="card empty-state"><span class="es-glyph">01</span><div class="es-text">Your mind reset entries will live here when your thoughts need a place to land.</div><div class="es-hint">Start with whatever feels loudest.</div></div>';
        return;
      }
      list.innerHTML = dumps.map(function(e) {
        return '<div class="dump-entry ' + (e.released ? "released" : "") + '" id="dump-' + e.id + '">' +
          '<div class="dump-header"><span class="dump-date">' + formatDate(e.created) + '</span><button class="quiet-del" type="button" onclick="rmDump(\'' + e.id + '\')" aria-label="Delete reset">' + xIcon() + '</button></div>' +
          dumpArea(e, "q1", "What is taking up space?", "Name the thought, worry, task, or feeling...") +
          dumpArea(e, "q2", "What am I afraid I will forget?", "Get it out of your head and onto the page...") +
          dumpArea(e, "q3", "What can wait?", "Permission to let some things wait...") +
          dumpArea(e, "q4", "What do I need to release today?", "Guilt, expectations, worry, someone else's opinion...") +
          '<div class="btn-row"><button class="btn btn-soft" type="button" onclick="lighter(\'' + e.id + '\')" ' + (e.released ? 'disabled style="background:var(--euca-bg);color:var(--euca-deep);border-color:var(--euca-l)"' : "") + '>' + (e.released ? "Released" : "I feel lighter") + '</button></div>' +
          '<div class="release-complete" style="' + (e.released ? "display:block" : "") + '"><div class="release-text">Your mind is a little lighter now.</div></div>' +
          '</div>';
      }).join("");
    }
    function dumpArea(e, field, label, placeholder) {
      return '<div class="dump-q">' + label + '</div><textarea class="field" rows="2" placeholder="' + placeholder + '" oninput="dumpIn(\'' + e.id + '\',\'' + field + '\',this.value)">' + escapeHTML(e[field]) + '</textarea>';
    }

    function addTask() {
      var input = document.getElementById("task-in");
      var text = input.value.trim();
      if (!text) return;
      tasks.push({ id: uid(), text: text, done: false });
      input.value = "";
      LS.set("tasks", tasks);
      renderTasks();
      input.focus();
      markUsedToday();
    }
    function toggleTask(id) {
      var t = tasks.find(function(x) { return x.id === id; });
      if (t) { t.done = !t.done; LS.set("tasks", tasks); renderTasks(); updateStats(); markUsedToday(); }
    }
    function delTask(id) {
      tasks = tasks.filter(function(x) { return x.id !== id; });
      LS.set("tasks", tasks);
      renderTasks();
      updateStats();
    }
    function renderTasks() {
      var list = document.getElementById("task-list");
      list.innerHTML = tasks.map(function(t) {
        return '<li class="check-item" id="task-' + t.id + '"><button class="chk ' + (t.done ? "on" : "") + '" type="button" onclick="toggleTask(\'' + t.id + '\')" aria-label="Toggle task"></button><span class="chk-text ' + (t.done ? "done" : "") + '">' + escapeHTML(t.text) + '</span><button class="quiet-del" type="button" onclick="delTask(\'' + t.id + '\')" aria-label="Delete task">' + xIcon() + '</button></li>';
      }).join("");
      var p = document.getElementById("task-prog");
      var done = tasks.filter(function(x) { return x.done; }).length;
      if (tasks.length) {
        p.style.display = "block";
        p.textContent = done === 0 ? "Start with the easiest one. Momentum counts." : done === tasks.length ? "All done. You showed up today." : "Good. Keep going gently.";
      } else {
        p.style.display = "none";
      }
      renderCurrentNextStep(false);
    }

    function updateTodayPath() {
      var values = [1, 2, 3].map(function(n) {
        var el = document.querySelector('[data-key="priority-' + n + '"]');
        return el ? el.value.trim() : "";
      });
      var filled = values.filter(Boolean);
      var summary = document.getElementById("path-summary");
      var line = document.getElementById("path-line");
      if (!summary || !line) return;
      if (!filled.length) {
        summary.textContent = "Start by naming just one thing.";
        line.textContent = "One clear step is enough.";
      } else {
        summary.textContent = "Today is asking for " + humanList(filled) + ".";
        if (filled.length === 1) line.textContent = "Good. Begin with this one before adding more.";
        if (filled.length === 2) line.textContent = "You have enough direction. Add a third only if it truly matters.";
        if (filled.length === 3) line.textContent = "Your path is clear. Start with #1 and let the rest wait.";
      }
    }
    function humanList(items) {
      if (items.length === 1) return items[0];
      if (items.length === 2) return items[0] + " and " + items[1];
      return items[0] + ", " + items[1] + ", and " + items[2];
    }
    function getPriorityValues() {
      return [1, 2, 3].map(function(n) {
        var el = document.querySelector('[data-key="priority-' + n + '"]');
        return { index: n, text: el ? el.value.trim() : "" };
      });
    }
    function syncCompletedPriorities() {
      var activeTexts = getPriorityValues().map(function(p) { return p.text; }).filter(Boolean);
      completedPriorities = completedPriorities.filter(function(text) {
        return activeTexts.indexOf(text) !== -1;
      });
      LS.set("completed-priorities", completedPriorities);
    }
    function findNextStep() {
      var firstOpenTask = tasks.find(function(task) { return !task.done; });
      if (firstOpenTask) return { type: "task", id: firstOpenTask.id, text: firstOpenTask.text };

      syncCompletedPriorities();
      var priorities = getPriorityValues();
      var firstPriority = priorities.find(function(p) {
        var alreadyDone = completedPriorities.indexOf(p.text) !== -1 || tasks.some(function(task) {
          return task.done && task.text === p.text;
        });
        return p.text && !alreadyDone;
      });
      if (firstPriority) return { type: "priority", index: firstPriority.index, text: firstPriority.text };

      return null;
    }
    function chooseNextBestStep() {
      syncCompletedPriorities();
      var step = findNextStep();
      var firstPriorityInput = document.querySelector('[data-key="priority-1"]');

      if (!step && !tasks.length && firstPriorityInput && !firstPriorityInput.value.trim()) {
        currentNextStep = null;
        LS.set("current-next-step", currentNextStep);
        renderCurrentNextStep(true, "Start here. Do not overthink the whole day.");
        firstPriorityInput.focus();
        showNextHelper();
        return;
      }

      currentNextStep = step;
      LS.set("current-next-step", currentNextStep);
      renderCurrentNextStep(true);
      highlightCurrentStep();
      showNextHelper();
    }
    function getCurrentStepElement(step) {
      if (!step) return null;
      if (step.type === "task") return document.getElementById("task-" + step.id);
      if (step.type === "priority") return document.getElementById("priority-row-" + step.index);
      return null;
    }
    function highlightCurrentStep() {
      var card = document.getElementById("current-step-card");
      var target = getCurrentStepElement(currentNextStep) || card;
      if (target) {
        target.classList.add("highlight");
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(function() { target.classList.remove("highlight"); }, 1200);
      }
    }
    function showNextHelper() {
      var helper = document.getElementById("next-step-helper");
      if (!helper) return;
      helper.classList.add("show");
      clearTimeout(chooseNextBestStep.timer);
      chooseNextBestStep.timer = setTimeout(function() { helper.classList.remove("show"); }, 2200);
    }
    function renderCurrentNextStep(scrollToCard, overrideLine) {
      var card = document.getElementById("current-step-card");
      var text = document.getElementById("current-step-text");
      var line = document.getElementById("current-step-line");
      if (!card || !text || !line) return;

      if (currentNextStep && currentNextStep.type === "task" && !tasks.some(function(task) { return task.id === currentNextStep.id && !task.done; })) {
        currentNextStep = findNextStep();
        LS.set("current-next-step", currentNextStep);
      }
      if (currentNextStep && currentNextStep.type === "priority" && completedPriorities.indexOf(currentNextStep.text) !== -1) {
        currentNextStep = findNextStep();
        LS.set("current-next-step", currentNextStep);
      }
      if (currentNextStep && currentNextStep.type === "priority") {
        var priority = getPriorityValues().find(function(p) { return p.index === currentNextStep.index; });
        if (!priority || priority.text !== currentNextStep.text) {
          currentNextStep = findNextStep();
          LS.set("current-next-step", currentNextStep);
        }
      }

      if (!currentNextStep) {
        var next = findNextStep();
        if (next) {
          currentNextStep = next;
          LS.set("current-next-step", currentNextStep);
        }
      }

      if (!currentNextStep) {
        var hasAnyPriority = getPriorityValues().some(function(p) { return p.text; });
        card.classList.toggle("show", !!overrideLine || hasAnyPriority || tasks.length > 0);
        text.textContent = hasAnyPriority || tasks.length > 0 ? "You are done for now. Let this be enough." : "";
        line.textContent = overrideLine || (hasAnyPriority || tasks.length > 0 ? "You are done for now. Let this be enough." : "Start here. Do not overthink the whole day.");
        var doneBtn = card.querySelector(".btn");
        if (doneBtn) doneBtn.style.display = hasAnyPriority || tasks.length > 0 ? "none" : "";
        if (scrollToCard && card.classList.contains("show")) card.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      card.classList.add("show");
      text.textContent = currentNextStep.text;
      line.textContent = "Work on this one next. Do not solve the whole day at once.";
      var btn = card.querySelector(".btn");
      if (btn) btn.style.display = "";
      if (scrollToCard) card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function markCurrentStepDone() {
      if (!currentNextStep) {
        currentNextStep = findNextStep();
        if (!currentNextStep) {
          renderCurrentNextStep(true);
          return;
        }
      }

      if (currentNextStep.type === "task") {
        var task = tasks.find(function(t) { return t.id === currentNextStep.id; });
        if (task) task.done = true;
        LS.set("tasks", tasks);
      }

      if (currentNextStep.type === "priority") {
        if (completedPriorities.indexOf(currentNextStep.text) === -1) completedPriorities.push(currentNextStep.text);
        LS.set("completed-priorities", completedPriorities);
        var exists = tasks.some(function(t) { return t.text === currentNextStep.text; });
        if (!exists) tasks.push({ id: uid(), text: currentNextStep.text, done: true, fromPriority: currentNextStep.index });
        LS.set("tasks", tasks);
      }

      currentNextStep = findNextStep();
      LS.set("current-next-step", currentNextStep);
      renderTasks();
      updateStats();
      markUsedToday();
      renderCurrentNextStep(true);
      highlightCurrentStep();
    }

    function initWeek() {
      var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      document.getElementById("day-rows").innerHTML = days.map(function(day, idx) {
        return '<div class="day-row"><div class="day-name">' + day + '</div><input class="day-in save-field" data-key="week-day-' + idx + '" placeholder="One gentle focus for ' + day + '"></div>';
      }).join("");
    }

    function addGoal() {
      var id = uid();
      goals.push({ id: id, title: "", milestones: [] });
      LS.set("goals", goals);
      renderGoals();
      setTimeout(function() {
        var input = document.querySelector("#goal-" + id + " .goal-title-in");
        if (input) input.focus();
      }, 50);
      markUsedToday();
    }
    function delGoal(id) {
      goals = goals.filter(function(g) { return g.id !== id; });
      LS.set("goals", goals);
      renderGoals();
    }
    function updateGoalTitle(id, value) {
      var g = goals.find(function(goal) { return goal.id === id; });
      if (g) { g.title = value; LS.set("goals", goals); }
    }
    function addMS(gid) {
      var input = document.getElementById("ms-in-" + gid);
      var text = input.value.trim();
      if (!text) return;
      var g = goals.find(function(goal) { return goal.id === gid; });
      if (g) {
        g.milestones.push({ id: uid(), text: text, done: false });
        LS.set("goals", goals);
        renderGoals();
        setTimeout(function() {
          var next = document.getElementById("ms-in-" + gid);
          if (next) next.focus();
        }, 30);
      }
      markUsedToday();
    }
    function toggleMS(gid, mid) {
      var g = goals.find(function(goal) { return goal.id === gid; });
      if (!g) return;
      var m = g.milestones.find(function(ms) { return ms.id === mid; });
      if (m) { m.done = !m.done; LS.set("goals", goals); renderGoals(); markUsedToday(); }
    }
    function delMS(gid, mid) {
      var g = goals.find(function(goal) { return goal.id === gid; });
      if (!g) return;
      g.milestones = g.milestones.filter(function(ms) { return ms.id !== mid; });
      LS.set("goals", goals);
      renderGoals();
    }
    function renderGoals() {
      var list = document.getElementById("goals-list");
      if (!goals.length) {
        list.innerHTML = '<div class="card goal-empty"><span class="ge-glyph">02</span><div class="ge-text">Your goals are waiting. Add one and break it into milestones.</div><div class="empty-hint">Use the button above to name one clear direction.</div></div>';
        return;
      }
      list.innerHTML = goals.map(function(g) {
        var done = g.milestones.filter(function(m) { return m.done; }).length;
        var total = g.milestones.length;
        var pct = total ? Math.round(done / total * 100) : 0;
        return '<div class="goal-card" id="goal-' + g.id + '">' +
          '<div class="goal-top"><input class="goal-title-in" type="text" placeholder="My goal is..." value="' + escapeHTML(g.title) + '" oninput="updateGoalTitle(\'' + g.id + '\',this.value)"><button class="quiet-del" type="button" onclick="delGoal(\'' + g.id + '\')" aria-label="Delete goal">' + xIcon() + '</button></div>' +
          '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="progress-pct">' + (total ? pct + "% complete - " + done + " of " + total + " milestones" : "Add a first milestone when you are ready.") + '</div>' +
          '<ul class="milestones">' + g.milestones.map(function(m) {
            return '<li class="ms"><button class="ms-chk ' + (m.done ? "on" : "") + '" type="button" onclick="toggleMS(\'' + g.id + '\',\'' + m.id + '\')" aria-label="Toggle milestone"></button><span class="ms-text ' + (m.done ? "done" : "") + '">' + escapeHTML(m.text) + '</span><button class="quiet-del" type="button" onclick="delMS(\'' + g.id + '\',\'' + m.id + '\')" aria-label="Delete milestone">' + xIcon() + '</button></li>';
          }).join("") + '</ul>' +
          '<div class="ms-add"><input class="text-input" id="ms-in-' + g.id + '" type="text" placeholder="Add a milestone..." onkeydown="if(event.key===\'Enter\')addMS(\'' + g.id + '\')"><button class="add-btn mini-add" type="button" onclick="addMS(\'' + g.id + '\')" aria-label="Add milestone"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>' +
          '</div>';
      }).join("");
    }

    function addHabit() {
      var input = document.getElementById("habit-in");
      var name = input.value.trim();
      if (!name) return;
      habits.push({ id: uid(), name: name, days: [0,0,0,0,0,0,0] });
      input.value = "";
      LS.set("habits", habits);
      renderHabits();
      input.focus();
      markUsedToday();
    }
    function toggleH(hid, day) {
      var h = habits.find(function(habit) { return habit.id === hid; });
      if (h) { h.days[day] = h.days[day] ? 0 : 1; LS.set("habits", habits); renderHabits(); markUsedToday(); }
    }
    function delHabit(id) {
      habits = habits.filter(function(h) { return h.id !== id; });
      LS.set("habits", habits);
      renderHabits();
    }
    function renderHabits() {
      var wrap = document.getElementById("habit-rows");
      if (!habits.length) {
        wrap.innerHTML = '<div class="habit-empty"><span class="he-glyph">03</span><p>Add your first habit above. Each dot you tap is a quiet act of self-respect.</p><div class="empty-hint">Begin with something small enough to repeat.</div></div>';
        return;
      }
      wrap.innerHTML = habits.map(function(h) {
        return '<div class="habit-row"><span class="h-name" title="' + escapeHTML(h.name) + '">' + escapeHTML(h.name) + '</span>' +
          h.days.map(function(done, idx) {
            return '<button class="h-dot ' + (done ? "on" : "") + '" type="button" onclick="toggleH(\'' + h.id + '\',' + idx + ')" aria-label="Toggle ' + escapeHTML(h.name) + '"></button>';
          }).join("") +
          '</div><div style="text-align:right;margin:-3px 4px 4px 0"><button class="quiet-del" type="button" onclick="delHabit(\'' + h.id + '\')" aria-label="Delete habit" style="display:inline-flex;width:26px;height:26px">' + xIcon() + '</button></div>';
      }).join("");
    }

    function renderAffirmationCards() {
      document.getElementById("cards-grid").innerHTML = AFFIRMATIONS.map(function(text, idx) {
        return '<button class="aff-card" type="button" onclick="chooseAffirmation(' + idx + ')"><span class="ac-rule"></span><div class="ac-quote">' + escapeHTML(text) + '</div><div class="ac-brand">Clear Mind Co.</div></button>';
      }).join("");
    }
    function chooseAffirmation(idx) {
      currentAffIdx = idx;
      LS.set("home-aff-idx", currentAffIdx);
      renderAffirmation();
      showPage("home");
    }

    function initJournal() {
      var d = new Date();
      document.getElementById("j-date").textContent = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      document.getElementById("j-prompt").textContent = J_PROMPTS[jPromptIdx];
      document.getElementById("journal-main").value = LS.get("journal-draft", "");
      jCount();
      renderJEntries();
    }
    function cyclePrompt() {
      jPromptIdx = (jPromptIdx + 1) % J_PROMPTS.length;
      var prompt = document.getElementById("j-prompt");
      prompt.style.opacity = "0";
      setTimeout(function() {
        prompt.textContent = J_PROMPTS[jPromptIdx];
        prompt.style.opacity = "1";
      }, 160);
      LS.set("j-prompt-idx", jPromptIdx);
    }
    function saveJournalDraft() {
      LS.set("journal-draft", document.getElementById("journal-main").value);
      updateStats();
    }
    function jCount() {
      var count = wordCount(document.getElementById("journal-main").value);
      document.getElementById("j-count").textContent = count ? count + " words" : "";
    }
    function saveJEntry() {
      var textarea = document.getElementById("journal-main");
      var text = textarea.value.trim();
      if (text.length < 3) return;
      var prompt = document.getElementById("j-prompt").textContent;
      jEntries.unshift({ id: uid(), date: new Date().toISOString(), prompt: prompt, text: text });
      LS.set("j-entries", jEntries);
      textarea.value = "";
      LS.set("journal-draft", "");
      jCount();
      renderJEntries();
      updateStats();
      markUsedToday();
      var btn = document.querySelector("#page-journal .btn-primary");
      var original = btn.textContent;
      btn.textContent = "Saved";
      setTimeout(function() { btn.textContent = original; }, 1600);
    }
    function clearJToday() {
      var textarea = document.getElementById("journal-main");
      textarea.value = "";
      LS.set("journal-draft", "");
      jCount();
      updateStats();
    }
    function deleteJEntry(id) {
      jEntries = jEntries.filter(function(e) { return e.id !== id; });
      LS.set("j-entries", jEntries);
      renderJEntries();
      updateStats();
    }
    function renderJEntries() {
      var wrap = document.getElementById("journal-past");
      if (!jEntries.length) {
        wrap.innerHTML = '<div class="card journal-empty"><span class="je-glyph">03</span><div class="je-text">Your journal is waiting. Write something today, even one sentence counts.</div></div>';
        return;
      }
      wrap.innerHTML = jEntries.map(function(e) {
        return '<article class="j-entry"><div class="j-entry-head"><div><span class="j-entry-date">' + formatDate(e.date) + '</span><span class="j-entry-prompt">' + escapeHTML(e.prompt) + '</span></div><button class="quiet-del" type="button" onclick="deleteJEntry(\'' + e.id + '\')" aria-label="Delete journal entry">' + xIcon() + '</button></div><div class="j-entry-text">' + escapeHTML(e.text) + '</div></article>';
      }).join("");
    }

    function xIcon() {
      return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    }

    function init() {
      buildNav();
      initWeek();
      initFields();
      initMood();
      initGreeting();
      renderAffirmation();
      renderDumps();
      renderTasks();
      renderGoals();
      renderHabits();
      renderAffirmationCards();
      initJournal();
      markUsedToday();
      var initial = location.hash ? location.hash.slice(1) : "home";
      if (!PAGES.some(function(p) { return p[0] === initial; })) initial = "home";
      showPage(initial);
    }

    document.addEventListener("DOMContentLoaded", init);
