import { create } from 'zustand';

if (typeof document !== 'undefined') document.documentElement.lang = localStorage.getItem('farmerLang') || 'en';

export const useStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('farmerUser')) || null,
  login: (user) => {
    localStorage.setItem('farmerUser', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('farmerUser');
    set({ user: null });
  },
  lang: localStorage.getItem('farmerLang') || 'en',
  setLang: (lang) => {
    localStorage.setItem('farmerLang', lang);
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
    set({ lang });
  },
}));
