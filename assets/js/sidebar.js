/**
 * SmartSpend — Sidebar JS
 * Collapse/expand, logout, active nav link
 */

const Sidebar = {
  init() {
    this.layout = document.querySelector('.app-layout');
    this.toggleBtn = document.querySelector('.sidebar-toggle');

    // Restore collapse state
    if (localStorage.getItem('sidebar_collapsed') === 'true') {
      this.layout?.classList.add('collapsed');
    }

    // Toggle collapse
    this.toggleBtn?.addEventListener('click', () => {
      const isCollapsed = this.layout.classList.toggle('collapsed');
      localStorage.setItem('sidebar_collapsed', isCollapsed);
    });

    // Logout button
    document.querySelector('[data-logout]')?.addEventListener('click', () => {
      Auth.logout();
      window.location.href = 'index.html';
    });

    // Mark active nav item
    this.markActive();
  },

  markActive() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item[href]').forEach(link => {
      const href = link.getAttribute('href').split('/').pop();
      if (href === current) {
        link.classList.add('active');
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  Sidebar.init();
});
