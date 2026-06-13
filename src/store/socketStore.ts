import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import { supabase } from '@/lib/supabase';

const SOCKET_URL = (import.meta.env.VITE_API_URL as string)?.replace('/api', '') ?? 'http://localhost:3000';

interface SocketStore {
  socket: Socket | null;
  connected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  updateToken: (token: string) => void;
  joinTask: (taskId: string) => void;
  joinDepartment: (deptId: string) => void;
  joinProject: (projectId: string) => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  connected: false,

  connect: (token: string) => {
    const existing = get().socket;
    if (existing?.connected) return;
    if (existing) { existing.removeAllListeners(); existing.disconnect(); }

    const socket = io(SOCKET_URL, {
      // Async auth: fetch the freshest Supabase session on every connect/reconnect
      // so expired tokens are never sent after a silent refresh.
      auth: (cb: (data: { token: string }) => void) => {
        supabase.auth.getSession()
          .then(({ data: { session } }) => cb({ token: session?.access_token ?? token }))
          .catch(() => cb({ token }));
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));
    socket.on('connect_error', (err: Error) => {
      console.warn('[Socket] connect_error:', err.message);
    });

    set({ socket });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    set({ socket: null, connected: false });
  },

  // No-op: token is now fetched dynamically via supabase.auth.getSession() on each connect
  updateToken: (_token: string) => {},

  joinTask: (taskId: string) => {
    get().socket?.emit('join:task', taskId);
  },

  joinDepartment: (deptId: string) => {
    get().socket?.emit('join:department', deptId);
  },

  joinProject: (projectId: string) => {
    get().socket?.emit('join:project', projectId);
  },
}));
