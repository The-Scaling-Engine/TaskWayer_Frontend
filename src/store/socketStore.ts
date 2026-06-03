import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';

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
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
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

  // Update auth token so reconnections use the latest token
  updateToken: (token: string) => {
    const socket = get().socket;
    if (socket) {
      (socket as Socket & { auth: { token: string } }).auth = { token };
    }
  },

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
