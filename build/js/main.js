/* ══════════════════════════════════════════════════════════════
   Red Orange Technologies — эталон, минимальный ванильный JS.

   ВНИМАНИЕ: в WordPress этот файл НЕ переносится. Он делает четыре вещи —
   переключает табы «Selected cases», открывает мобильное меню, отдаёт
   whitepaper после формы в футере Appero и раскрывает шаги процесса
   (блок 28). Первые три в Elementor нативные — Nested Tabs, Nav Menu (Pro)
   и Form (Pro) с действием Redirect. Шагам процесса нужен свой сниппет:
   раскрытие наведением на десктопе и резерв высоты виджет не умеет
   (spec/page-salesforce.md, реестр паспорта №20).
   Всё остальное работает без JS — на CSS.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Мобильное меню ────────────────────────────────────────── */
  var header = document.querySelector('.site-header');
  var burger = header && header.querySelector('.site-header__burger');
  var backdrop = document.querySelector('.site-menu-backdrop');

  if (header && burger) {
    var setMenu = function (open) {
      header.dataset.menu = open ? 'open' : 'closed';
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (backdrop) backdrop.hidden = !open;
      // Фон не прокручивается, пока панель открыта. Страница при этом не должна
      // прыгать: место под полосу прокрутки держит scrollbar-gutter: stable
      // (см. components.css), поэтому здесь достаточно самого overflow.
      document.documentElement.style.overflow = open ? 'hidden' : '';
    };

    burger.addEventListener('click', function () {
      setMenu(header.dataset.menu !== 'open');
    });

    if (backdrop) backdrop.addEventListener('click', function () { setMenu(false); });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.dataset.menu === 'open') {
        setMenu(false);
        burger.focus();
      }
    });

    // выбрали пункт — панель закрывается
    header.querySelectorAll('.site-nav a').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });

    // вернулись на десктоп — сбрасываем состояние, иначе меню останется «открытым»
    var desktop = window.matchMedia('(min-width: 1025px)');
    var onBreakpoint = function (e) { if (e.matches) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
    else desktop.addListener(onBreakpoint);

    setMenu(false);
  }

  /* ── Подменю Products / Company ─────────────────────────────
     На десктопе раскрывает наведение (чистый CSS), поэтому кнопка-стрелка
     там не должна брать фокус. На планшете и мобильном она — настоящая
     кнопка-аккордеон. В Elementor то же делает сам виджет Nav Menu. */
  var toggles = Array.prototype.slice.call(
    document.querySelectorAll('.site-nav__toggle'));

  if (toggles.length) {
    var compact = window.matchMedia('(max-width: 1024px)');

    var closeAllSubs = function () {
      toggles.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
    };

    var applyMode = function () {
      toggles.forEach(function (t) {
        if (compact.matches) t.removeAttribute('tabindex');
        else t.setAttribute('tabindex', '-1');
      });
      closeAllSubs();
    };

    toggles.forEach(function (t) {
      t.addEventListener('click', function () {
        if (!compact.matches) return;
        var open = t.getAttribute('aria-expanded') === 'true';
        closeAllSubs();
        t.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });

    if (compact.addEventListener) compact.addEventListener('change', applyMode);
    else compact.addListener(applyMode);

    applyMode();
  }

  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute('aria-controls'));
    });

    function select(index) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.classList.toggle('case-list__item--active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        if (panels[i]) panels[i].classList.toggle('case-panel--off', !on);
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i); });

      tab.addEventListener('keydown', function (event) {
        var step = 0;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') step = 1;
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') step = -1;
        if (event.key === 'Home') step = -i;
        if (event.key === 'End') step = tabs.length - 1 - i;
        if (!step) return;

        event.preventDefault();
        var next = (i + step + tabs.length) % tabs.length;
        select(next);
        tabs[next].focus();
      });
    });

    var initial = tabs.findIndex(function (tab) {
      return tab.getAttribute('aria-selected') === 'true';
    });
    select(initial < 0 ? 0 : initial);
  });

  /* ── Шаги процесса (блок 28) ───────────────────────────────────
     Десктоп: шаг раскрывается наведением и остаётся раскрытым, когда курсор
     ушёл. Планшет и мобильный: только тапом. Клавиатура — Enter / Space на
     кнопке шага. Всегда раскрыт ровно один шаг, в плитке — его кадр.

     Колонка шагов получает min-height самого длинного раскрытого состояния,
     поэтому ряд с плиткой не меняет высоту при смене шага. */
  var hoverMode = window.matchMedia('(min-width: 1025px) and (hover: hover)');

  document.querySelectorAll('.process').forEach(function (list) {
    var items = Array.prototype.slice.call(list.querySelectorAll(':scope > .process__item'));
    if (!items.length) return;

    var plate = list.parentElement && list.parentElement.querySelector(':scope > .process-plate');
    var shots = plate ? Array.prototype.slice.call(plate.querySelectorAll('.process-plate__shot')) : [];

    function current() {
      return items.findIndex(function (item) { return item.classList.contains('process__item--open'); });
    }

    function open(index) {
      items.forEach(function (item, i) {
        var on = i === index;
        item.classList.toggle('process__item--open', on);
        var toggle = item.querySelector('.process__toggle');
        if (toggle) toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
      shots.forEach(function (shot, i) {
        shot.classList.toggle('process-plate__shot--on', i === index);
      });
    }

    // Резерв: сумма шагов без описаний + самое длинное описание. Абзац внутри
    // обёртки сохраняет полную высоту в любом состоянии, даже посреди анимации.
    // Замер дробный (getBoundingClientRect): offsetHeight округляет, и ряд
    // гулял на 0.4 px между шагами. На время замера колонка встаёт по своему
    // содержимому: иначе растяжение под соседнюю графику (NOVA) или прошлый
    // резерв, ушедший в последний шаг с Flex Grow 1, попали бы в сумму,
    // и резерв рос бы с каждым пересчётом.
    function reserve() {
      // растягивает только ряд (на десктопе); в колонке (≤1024) align-self
      // сузил бы список по ширине и текст перенёсся бы иначе
      var inRow = getComputedStyle(list.parentElement).flexDirection.indexOf('row') === 0;
      list.style.minHeight = '';
      if (inRow) list.style.alignSelf = 'flex-start';
      var base = 0;
      var longest = 0;
      items.forEach(function (item) {
        var text = item.querySelector('.process__text');
        var para = text && text.querySelector('p');
        base += item.getBoundingClientRect().height - (text ? text.getBoundingClientRect().height : 0);
        if (para) longest = Math.max(longest, para.getBoundingClientRect().height);
      });
      list.style.alignSelf = '';
      // до четверти пикселя вверх — чтобы резерв не оказался на тысячную ниже раскладки
      list.style.minHeight = Math.ceil((base + longest) * 4) / 4 + 'px';
    }

    // Наведение — только реальным движением мыши. Координаты сравниваются,
    // чтобы сдвиг раскладки под неподвижным курсором не считался движением:
    // иначе раскрытие цепочкой перескакивало бы на соседний шаг.
    var lastX = null;
    var lastY = null;
    list.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse' || !hoverMode.matches) return;
      if (event.clientX === lastX && event.clientY === lastY) return;
      lastX = event.clientX;
      lastY = event.clientY;
      var index = items.indexOf(event.target.closest('.process__item'));
      if (index > -1 && index !== current()) open(index);
    });

    // Тап на планшете и мобильном, Enter / Space с клавиатуры. На десктопе
    // шаг под курсором уже раскрыт наведением — клик ничего не меняет.
    list.addEventListener('click', function (event) {
      var index = items.indexOf(event.target.closest('.process__item'));
      if (index > -1 && index !== current()) open(index);
    });

    var initial = current();
    open(initial < 0 ? 0 : initial);
    reserve();

    var pending = false;
    window.addEventListener('resize', function () {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(function () { pending = false; reserve(); });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserve);
  });

  /* ── Лид-магнит: после отправки формы отдаём файл ──────────────
     submit срабатывает только у валидной формы — пустые обязательные
     поля браузер не пропустит. Данные никуда не уходят: это эмуляция
     Elementor Form → Actions After Submit → Redirect на файл в Media. */
  document.querySelectorAll('form[data-download]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      window.location.href = form.getAttribute('data-download');
    });
  });

  /* ── Фильтр списка кейсов (блок 54) ────────────────────────────
     Эмуляция Taxonomy Filter (Pro): чип прячет плитки чужих рубрик.
     В WordPress не переносится — фильтр делает сам виджет. */
  document.querySelectorAll('.filter').forEach(function (bar) {
    var grid = bar.parentElement.querySelector('.case-grid');
    if (!grid) return;
    var chips = bar.querySelectorAll('.filter-chip');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        grid.querySelectorAll('.case-tile').forEach(function (tile) {
          var cats = (tile.getAttribute('data-cats') || '').split(' ');
          tile.hidden = key !== 'all' && cats.indexOf(key) < 0;
        });
      });
    });
  });
})();
