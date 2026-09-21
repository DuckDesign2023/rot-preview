/* ══════════════════════════════════════════════════════════════
   Red Orange Technologies — эталон, минимальный ванильный JS.

   ВНИМАНИЕ: в WordPress этот файл НЕ переносится. Он переключает табы
   «Selected cases», открывает мобильное меню и мега-меню Solutions, отдаёт
   whitepaper после формы в футере Appero и раскрывает шаги процесса
   (блок 28). Первые четыре в Elementor нативные — Nested Tabs, Nav Menu (Pro),
   Mega Menu (Pro) и Form (Pro) с действием Redirect. Шагам процесса нужен
   свой сниппет: раскрытие наведением на десктопе и резерв высоты виджет
   не умеет (spec/page-salesforce.md, реестр паспорта №20).
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

  /* ── Мега-меню Solutions ──────────────────────────────────────
     Десктоп: раскрывается наведением, закрывается с задержкой 120 мс —
     панель начинается от нижнего края хедера, между ней и пунктом есть
     зазор, и без задержки курсор «проваливался» по дороге. Планшет и
     мобильный: аккордеон по тапу. Клавиатура: Enter / Space на кнопке,
     Esc закрывает и возвращает фокус. Клик мимо панели тоже закрывает.
     В WordPress не переносится — всё это делает виджет Mega Menu (Pro). */
  var megaItem = document.querySelector('.site-nav__item--mega');
  var megaTrigger = megaItem && megaItem.querySelector('.site-nav__trigger');

  if (megaItem && megaTrigger) {
    var hoverable = window.matchMedia('(min-width: 1025px) and (hover: hover)');
    var megaTimer = null;

    var setMega = function (open) {
      window.clearTimeout(megaTimer);
      megaItem.dataset.open = open ? 'true' : 'false';
      megaTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    megaTrigger.addEventListener('click', function () {
      setMega(megaItem.dataset.open !== 'true');
    });

    megaItem.addEventListener('mouseenter', function () {
      if (hoverable.matches) setMega(true);
    });

    megaItem.addEventListener('mouseleave', function () {
      if (!hoverable.matches) return;
      window.clearTimeout(megaTimer);
      megaTimer = window.setTimeout(function () { setMega(false); }, 120);
    });

    // курсор ушёл на соседний пункт меню — панель закрывается сразу
    Array.prototype.forEach.call(megaItem.parentElement.children, function (sibling) {
      if (sibling === megaItem) return;
      sibling.addEventListener('mouseenter', function () {
        if (hoverable.matches) setMega(false);
      });
    });

    megaItem.querySelectorAll('.mega-card').forEach(function (card) {
      card.addEventListener('click', function () { setMega(false); });
    });

    megaItem.addEventListener('focusout', function (event) {
      if (hoverable.matches && !megaItem.contains(event.relatedTarget)) setMega(false);
    });

    document.addEventListener('click', function (event) {
      if (megaItem.dataset.open === 'true' && !megaItem.contains(event.target)) setMega(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && megaItem.dataset.open === 'true') {
        setMega(false);
        megaTrigger.focus();
      }
    });

    var onHoverMode = function () { setMega(false); };
    if (hoverable.addEventListener) hoverable.addEventListener('change', onHoverMode);
    else hoverable.addListener(onHoverMode);

    setMega(false);
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
    var wrap = bar.parentElement;
    var grid = wrap.querySelector('.case-grid');
    if (!grid) return;

    var chips = bar.querySelectorAll('.filter-chip');
    var tiles = Array.prototype.slice.call(grid.querySelectorAll('.case-tile'));
    var more = wrap.querySelector('.load-more__btn');
    var step = parseInt(grid.getAttribute('data-step'), 10) || tiles.length;
    var key = 'all';
    var shown = step;

    /* Фильтр и «показать больше» — одно состояние: сколько плиток
       подошло под фильтр и сколько из них уже показано. Смена фильтра
       возвращает выдачу к первой порции, как это делает Loop Grid
       в Elementor (фильтр перезапрашивает запрос с первой страницы). */
    function apply() {
      var matched = 0;
      tiles.forEach(function (tile) {
        var cats = (tile.getAttribute('data-cats') || '').split(' ');
        var fits = key === 'all' || cats.indexOf(key) >= 0;
        if (fits) matched++;
        tile.hidden = !fits || matched > shown;
      });
      if (more) more.parentElement.hidden = matched <= shown;
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        key = chip.getAttribute('data-filter');
        shown = step;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        apply();
      });
    });

    if (more) {
      more.addEventListener('click', function () {
        shown += step;
        apply();
        /* фокус на первую из доезжающих плиток — иначе после клика
           он остаётся на кнопке, которая уехала вниз или исчезла */
        var next = tiles.filter(function (t) { return !t.hidden; })[shown - step];
        if (next) next.focus({ preventScroll: true });
      });
    }

    apply();
  });

  /* ── Карта офисов (Contact) ─────────────────────────────────────
     Встроенная карта Google без ключа показывает одну точку, поэтому
     общий вид собран так: iframe по центру и зуму, которые посчитаны под
     размер блока (все три офиса внутри), а метки — свои кнопки поверх,
     в пикселях Web Mercator (тайл 256). Клик по метке или по «Show on map»
     в карточке — карта места с булавкой Google, zoom 15.
     С ключом API заменяется на Maps JavaScript API (fitBounds / panTo). */
  document.querySelectorAll('.office-map').forEach(function (map) {
    var frame = map.querySelector('.office-map__frame');
    var pins = Array.prototype.slice.call(map.querySelectorAll('.office-map__pin'));
    var allBtn = map.querySelector('.office-map__all');
    var section = map.closest('section') || document;
    var mode = 'all';
    var lastKey = '';

    function mercY(lat) {
      var s = Math.sin(lat * Math.PI / 180);
      return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);   // 0…1
    }
    function unY(y) {
      return 360 / Math.PI * Math.atan(Math.exp((0.5 - y) * 2 * Math.PI)) - 90;
    }
    function pts() {
      return pins.map(function (p) {
        return { el: p, x: (+p.dataset.lng + 180) / 360, y: mercY(+p.dataset.lat) };
      });
    }

    function overview() {
      var w = map.clientWidth, h = map.clientHeight;
      var PAD = Math.min(72, w * 0.12);   // поле от меток до края: на телефоне уже, иначе зум падает до 1
      var P = pts();
      var minX = Math.min.apply(null, P.map(function (p) { return p.x; }));
      var maxX = Math.max.apply(null, P.map(function (p) { return p.x; }));
      var minY = Math.min.apply(null, P.map(function (p) { return p.y; }));
      var maxY = Math.max.apply(null, P.map(function (p) { return p.y; }));
      var z = 1;
      for (var t = 8; t >= 1; t--) {
        var world = 256 * Math.pow(2, t);
        if ((maxX - minX) * world <= w - 2 * PAD && (maxY - minY) * world <= h - 2 * PAD) { z = t; break; }
      }
      var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      var world2 = 256 * Math.pow(2, z);
      P.forEach(function (p) {
        var left = w / 2 + (p.x - cx) * world2;
        p.el.style.left = left + 'px';
        p.el.style.top = (h / 2 + (p.y - cy) * world2) + 'px';
        p.el.classList.toggle('office-map__pin--left', left > w / 2);   // подпись к центру, не за край
      });
      var lat = unY(cy).toFixed(4), lng = (cx * 360 - 180).toFixed(4);
      var key = lat + ',' + lng + ',' + z;
      if (key !== lastKey || mode !== 'all') {
        frame.src = 'https://maps.google.com/maps?ll=' + lat + ',' + lng + '&z=' + z + '&hl=en&output=embed';
        lastKey = key;
      }
      mode = 'all';
      map.classList.remove('office-map--zoomed');
      allBtn.hidden = true;
    }

    function zoomTo(key) {
      var pin = pins.filter(function (p) { return p.dataset.office === key; })[0];
      if (!pin) return;
      mode = key;
      lastKey = '';
      frame.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(pin.dataset.q) + '&z=15&hl=en&output=embed';
      map.classList.add('office-map--zoomed');
      allBtn.hidden = false;
      section.querySelectorAll('[data-office]').forEach(function (b) {
        if (b.classList.contains('address__map')) b.setAttribute('aria-pressed', String(b.dataset.office === key));
      });
    }

    pins.forEach(function (p) {
      p.addEventListener('click', function () { zoomTo(p.dataset.office); });
    });
    section.querySelectorAll('.address__map[data-office]').forEach(function (b) {
      b.addEventListener('click', function () {
        zoomTo(b.dataset.office);
        map.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
    allBtn.addEventListener('click', function () {
      section.querySelectorAll('.address__map[aria-pressed]').forEach(function (b) { b.removeAttribute('aria-pressed'); });
      overview();
    });

    overview();
    var pending = false;
    window.addEventListener('resize', function () {
      if (pending || mode !== 'all') return;
      pending = true;
      window.requestAnimationFrame(function () { pending = false; overview(); });
    });
  });
})();
