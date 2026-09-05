import { create } from 'zustand';

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
}));
