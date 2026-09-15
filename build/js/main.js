/* ══════════════════════════════════════════════════════════════
   Red Orange Technologies — эталон, минимальный ванильный JS.

   ВНИМАНИЕ: в WordPress этот файл НЕ переносится. Он делает три вещи —
   переключает табы «Selected cases», открывает мобильное меню и отдаёт
   whitepaper после формы в футере Appero; в Elementor это нативные
   Nested Tabs, Nav Menu (Pro) и Form (Pro) с действием Redirect, каждый
   со своим скриптом и своей ARIA. Скрипт нужен только для того, чтобы
   эталон вёл себя как готовая страница при показе клиенту.
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
})();
