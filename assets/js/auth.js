/**
 * SmartSpend — Auth (демо-режим)
 * Управляет состоянием "вошёл / не вошёл" через localStorage
 */

const AUTH_KEY = 'smartspend_auth';
const APP_ENTRY = 'feed.html';
const LANDING   = 'index.html';

const Auth = {
  isLoggedIn() {
    return localStorage.getItem(AUTH_KEY) === 'true';
  },

  login() {
    localStorage.setItem(AUTH_KEY, 'true');
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
  },

  /** Вызывается на app-страницах: редирект на лендинг если не авторизован */
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = LANDING;
    }
  },

  /** Вызывается на лендинге: если уже авторизован — меняем кнопку */
  updateLandingUI() {
    const ctaBtns = document.querySelectorAll('[data-cta-login]');
    if (this.isLoggedIn()) {
      ctaBtns.forEach(btn => {
        btn.textContent = 'Перейти в приложение →';
        btn.addEventListener('click', () => { window.location.href = APP_ENTRY; });
      });
    } else {
      ctaBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          // Открываем квиз
          QuizModal.open(() => {
            Auth.login();
            window.location.href = APP_ENTRY;
          });
        });
      });
    }

    // Кнопки "Пройти тест" — всегда открывают квиз
    const quizBtns = document.querySelectorAll('[data-cta-quiz]');
    quizBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        QuizModal.open(() => {
          Auth.login();
          window.location.href = APP_ENTRY;
        });
      });
    });
  }
};
