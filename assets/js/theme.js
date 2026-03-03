/**
 * SmartSpend — Theme JS
 * Переключение светлой / тёмной темы
 */

const Theme = {
  KEY: 'smartspend_theme',

  init() {
    // Apply saved theme immediately (before render)
    const saved = localStorage.getItem(this.KEY);
    if (saved === 'dark') {
      document.body.classList.add('dark');
    } else if (saved === 'light') {
      document.body.classList.remove('dark');
    } else {
      // Auto: follow system
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark');
      }
    }

    // Bind toggle buttons
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', () => this.toggle());
      this.updateIcon(btn);
    });

    // Listen to system changes if auto
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(this.KEY)) {
        document.body.classList.toggle('dark', e.matches);
        document.querySelectorAll('[data-theme-toggle]').forEach(btn => this.updateIcon(btn));
      }
    });
  },

  isDark() {
    return document.body.classList.contains('dark');
  },

  toggle() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem(this.KEY, isDark ? 'dark' : 'light');
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => this.updateIcon(btn));
  },

  updateIcon(btn) {
    const isDark = this.isDark();
    btn.setAttribute('title', isDark ? 'Светлая тема' : 'Тёмная тема');
    // Update SVG icon if present
    const icon = btn.querySelector('[data-theme-icon]');
    if (icon) {
      icon.innerHTML = isDark
        ? `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
        : `<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/>
           <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
    }
  }
};

// Apply theme immediately — script is at bottom of body so document.body is available
(function() {
  const saved = localStorage.getItem('smartspend_theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark');
  }
})();

document.addEventListener('DOMContentLoaded', () => Theme.init());
