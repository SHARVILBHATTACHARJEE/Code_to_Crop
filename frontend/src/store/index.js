import { create } from 'zustand';

export const useStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('farmerUser')) || null,
  token: localStorage.getItem('farmerToken') || null,
  login: (user, token) => {
    localStorage.setItem('farmerUser', JSON.stringify(user));
    localStorage.setItem('farmerToken', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('farmerUser');
    localStorage.removeItem('farmerToken');
    set({ user: null, token: null });
  },
}));
