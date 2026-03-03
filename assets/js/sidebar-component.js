/**
 * SmartSpend — Sidebar Component
 * Инжектирует HTML сайдбара на app-страницах
 */

function renderSidebar(activePage) {
  const username = localStorage.getItem('smartspend_username') || 'Никита Орлов';
  const initials = username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const navItems = [
    { href: 'feed.html',       icon: iconFeed(),      label: 'Лента',          id: 'feed' },
    { href: 'inventory.html',  icon: iconInventory(), label: 'Инвентарь',      id: 'inventory' },
    { href: 'catalog.html',    icon: iconCatalog(),   label: 'Каталог наборов',id: 'catalog' },
  ];
  const bottomItems = [
    { href: 'profile.html',   icon: iconProfile(),   label: 'Профиль',   id: 'profile' },
    { href: 'settings.html',  icon: iconSettings(),  label: 'Настройки', id: 'settings' },
  ];

  const navHTML = navItems.map(item => `
    <a class="nav-item${activePage === item.id ? ' active' : ''}" href="${item.href}">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
    </a>
  `).join('');

  const bottomHTML = bottomItems.map(item => `
    <a class="nav-item${activePage === item.id ? ' active' : ''}" href="${item.href}">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
    </a>
  `).join('');

  return `
    <aside class="sidebar">
      <a class="sidebar-logo" href="feed.html">
        <div class="logo-mark">
          <svg viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="9" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
            <rect x="2" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
            <rect x="9" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
          </svg>
        </div>
        <span class="sidebar-logo-text">SmartSpend</span>
        <button class="sidebar-toggle" title="Свернуть">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M10 4L6 8l4 4"/>
          </svg>
        </button>
      </a>

      <nav class="sidebar-nav">
        ${navHTML}
        <div class="nav-divider"></div>
        ${bottomHTML}
      </nav>

      <div class="sidebar-bottom">
        <div class="sidebar-user">
          <div class="avatar avatar-sm">${initials}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${username}</div>
            <div class="sidebar-user-plan">Pro</div>
          </div>
        </div>
        <button class="sidebar-action" data-theme-toggle title="Переключить тему">
          <svg class="sidebar-action-icon" viewBox="0 0 24 24" fill="none" data-theme-icon></svg>
          <span class="sidebar-action-label">Тема</span>
        </button>
        <button class="sidebar-action" data-logout>
          <svg class="sidebar-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          <span class="sidebar-action-label">Выйти</span>
        </button>
      </div>
    </aside>
  `;
}

// SVG icons
function iconFeed() {
  return `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M3 5h12M3 9h8M3 13h5"/></svg>`;
}
function iconInventory() {
  return `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="2" y="3" width="14" height="12" rx="2"/><path d="M6 7h6M6 11h4"/></svg>`;
}
function iconCatalog() {
  return `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5"/><rect x="2" y="10" width="6" height="6" rx="1.5"/><rect x="10" y="10" width="6" height="6" rx="1.5"/></svg>`;
}
function iconProfile() {
  return `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="9" cy="6" r="3"/><path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>`;
}
function iconSettings() {
  return `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="9" cy="9" r="2.5"/><path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M4.2 4.2l1 1M12.8 12.8l1 1M4.2 13.8l1-1M12.8 5.2l1-1"/></svg>`;
}

// Init sidebar on page
function initSidebarPage(activePage) {
  const layout = document.querySelector('.app-layout');
  if (!layout) return;

  // Insert sidebar
  layout.insertAdjacentHTML('afterbegin', renderSidebar(activePage));

  // Collapse state
  if (localStorage.getItem('sidebar_collapsed') === 'true') {
    layout.classList.add('collapsed');
  }

  // Toggle collapse
  layout.querySelector('.sidebar-toggle')?.addEventListener('click', e => {
    e.preventDefault();
    const collapsed = layout.classList.toggle('collapsed');
    localStorage.setItem('sidebar_collapsed', collapsed);
  });

  // Logout
  layout.querySelector('[data-logout]')?.addEventListener('click', () => {
    localStorage.removeItem('smartspend_auth');
    location.href = 'index.html';
  });
}
