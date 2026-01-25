import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    access_token: string | null;
    refresh_token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, access_token: string, refresh_token?: string) => void;
    updateUser: (user: User) => void;
    clearAuth: () => void;
    setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            access_token: localStorage.getItem('access_token'),
            refresh_token: localStorage.getItem('refresh_token'),
            isAuthenticated: !!localStorage.getItem('access_token'),

            setAuth: (user, access_token, refresh_token) => {
                set({
                    user,
                    access_token,
                    refresh_token: refresh_token || null,
                    isAuthenticated: true
                });
                localStorage.setItem('access_token', access_token);
                if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
                localStorage.setItem('user', JSON.stringify(user));
            },

            updateUser: (user) => {
                set({ user });
                localStorage.setItem('user', JSON.stringify(user));
            },

            clearAuth: () => {
                set({ user: null, access_token: null, refresh_token: null, isAuthenticated: false });
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
            },

            setAccessToken: (token) => {
                set({ access_token: token });
                localStorage.setItem('access_token', token);
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
