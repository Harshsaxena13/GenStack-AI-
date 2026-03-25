/**
 * Tasko — Fully Functional Todo App
 * script.js
 *
 * Features:
 *  - Add / delete / toggle tasks
 *  - Filter: All / Active / Done
 *  - LocalStorage persistence
 *  - Remaining count + "Clear done" button
 *  - Toast notifications
 *  - Keyboard accessibility (Enter to add, Escape to clear input)
 */

(function () {
  'use strict';

  /* ── Constants ── */
  var STORAGE_KEY = 'tasko_tasks';

  /* ── State ── */
  var tasks  = [];
  var filter = 'all';   // 'all' | 'active' | 'completed'

  /* ── DOM refs (populated after DOMContentLoaded) ── */
  var inputEl, addBtn, taskList, emptyState,
      remainingCount, clearCompletedBtn, filterBtns, toast;

  var toastTimer = null;

  /* ═══════════════════════════════════════
     TASK MODEL
  ═══════════════════════════════════════ */
  function createTask(text) {
    return {
      id:        Date.now() + Math.random().toString(36).slice(2),
      text:      text.trim(),
      completed: false
    };
  }

  /* ═══════════════════════════════════════
     PERSISTENCE
  ═══════════════════════════════════════ */
  function loadTasks() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Could not load tasks:', e);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Could not save tasks:', e);
    }
  }

  /* ═══════════════════════════════════════
     RENDERING
  ═══════════════════════════════════════ */
  function getFilteredTasks() {
    if (filter === 'active')    return tasks.filter(function (t) { return !t.completed; });
    if (filter === 'completed') return tasks.filter(function (t) { return t.completed; });
    return tasks;
  }

  function renderTasks() {
    var visible = getFilteredTasks();

    /* Empty state */
    if (visible.length === 0) {
      taskList.innerHTML = '';
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
      /* Rebuild list */
      taskList.innerHTML = '';
      visible.forEach(function (task) {
        taskList.appendChild(buildTaskEl(task));
      });
    }

    updateFooter();
  }

  function buildTaskEl(task) {
    var li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    /* Checkbox */
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'task-checkbox';
    cb.checked = task.completed;
    cb.setAttribute('aria-label', 'Mark task as ' + (task.completed ? 'active' : 'complete'));
    cb.addEventListener('change', function () {
      toggleTask(task.id);
    });

    /* Label */
    var label = document.createElement('span');
    label.className = 'task-label';
    label.textContent = task.text;
    label.addEventListener('click', function () {
      toggleTask(task.id);
    });

    /* Delete button */
    var del = document.createElement('button');
    del.className = 'delete-btn';
    del.innerHTML = '&#10005;';
    del.setAttribute('aria-label', 'Delete task: ' + task.text);
    del.addEventListener('click', function () {
      deleteTask(task.id, li);
    });

    li.appendChild(cb);
    li.appendChild(label);
    li.appendChild(del);

    return li;
  }

  function updateFooter() {
    var active    = tasks.filter(function (t) { return !t.completed; }).length;
    var completed = tasks.filter(function (t) { return t.completed; }).length;

    remainingCount.textContent = active === 1
      ? '1 task left'
      : active + ' tasks left';

    if (completed > 0) {
      clearCompletedBtn.hidden = false;
      clearCompletedBtn.textContent = 'Clear done (' + completed + ')';
    } else {
      clearCompletedBtn.hidden = true;
    }
  }

  /* ═══════════════════════════════════════
     ACTIONS
  ═══════════════════════════════════════ */
  function addTask() {
    var text = inputEl.value.trim();
    if (!text) {
      inputEl.focus();
      shakeInput();
      return;
    }

    var task = createTask(text);
    tasks.unshift(task);   // newest first
    saveTasks();
    inputEl.value = '';
    updateAddBtn();
    renderTasks();
    showToast('Task added ✦');
  }

  function toggleTask(id) {
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }

  function deleteTask(id, liEl) {
    /* Animate out first, then remove from state */
    liEl.classList.add('removing');
    liEl.addEventListener('animationend', function () {
      tasks = tasks.filter(function (t) { return t.id !== id; });
      saveTasks();
      renderTasks();
    }, { once: true });
    showToast('Task removed');
  }

  function clearCompleted() {
    tasks = tasks.filter(function (t) { return !t.completed; });
    saveTasks();
    renderTasks();
    showToast('Completed tasks cleared');
  }

  function setFilter(newFilter) {
    filter = newFilter;
    filterBtns.forEach(function (btn) {
      var isActive = btn.dataset.filter === filter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
    renderTasks();
  }

  /* ═══════════════════════════════════════
     UI HELPERS
  ═══════════════════════════════════════ */
  function updateAddBtn() {
    addBtn.disabled = inputEl.value.trim().length === 0;
  }

  function shakeInput() {
    var wrapper = inputEl.closest('.input-wrapper');
    if (!wrapper) return;
    wrapper.style.animation = 'none';
    wrapper.offsetHeight; /* reflow */
    wrapper.style.animation = 'shake 0.35s ease';
    wrapper.addEventListener('animationend', function () {
      wrapper.style.animation = '';
    }, { once: true });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2200);
  }

  /* ═══════════════════════════════════════
     SHAKE KEYFRAME (injected dynamically)
  ═══════════════════════════════════════ */
  (function injectShakeStyle() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes shake {',
      '  0%,100% { transform: translateX(0); }',
      '  20%      { transform: translateX(-6px); }',
      '  40%      { transform: translateX(6px); }',
      '  60%      { transform: translateX(-4px); }',
      '  80%      { transform: translateX(4px); }',
      '}'
    ].join('');
    document.head.appendChild(style);
  })();

  /* ═══════════════════════════════════════
     INIT
  ═══════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    /* Grab DOM refs */
    inputEl           = document.getElementById('new-task-input');
    addBtn            = document.getElementById('add-task-btn');
    taskList          = document.getElementById('task-list');
    emptyState        = document.getElementById('empty-state');
    remainingCount    = document.getElementById('remaining-count');
    clearCompletedBtn = document.getElementById('clear-completed-btn');
    filterBtns        = document.querySelectorAll('.filter-btn');
    toast             = document.getElementById('toast');

    /* Load persisted tasks */
    tasks = loadTasks();

    /* Add button */
    addBtn.disabled = true;
    addBtn.addEventListener('click', addTask);

    /* Input: live enable/disable Add + Enter key */
    inputEl.addEventListener('input', updateAddBtn);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter')  addTask();
      if (e.key === 'Escape') { inputEl.value = ''; updateAddBtn(); }
    });

    /* Filter buttons */
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setFilter(btn.dataset.filter);
      });
    });

    /* Clear completed */
    clearCompletedBtn.addEventListener('click', clearCompleted);

    /* Initial render */
    renderTasks();
  });

})();