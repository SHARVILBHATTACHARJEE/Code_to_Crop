import { create } from 'zustand';

export const useStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('officerUser')) || null,
  token: localStorage.getItem('officerToken') || null,
  login: (user, token) => {
    localStorage.setItem('officerUser', JSON.stringify(user));
    localStorage.setItem('officerToken', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('officerUser');
    localStorage.removeItem('officerToken');
    set({ user: null, token: null });
  },
}));
