// ============================================
// USER (matches backend User model exactly)
// Source: MicroDo_Backend/src/models/User.ts
// ============================================
export interface User {
  _id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt?: string;
}

// ============================================
// TASK (matches backend Task model exactly)
// Source: MicroDo_Backend/src/models/Task.ts
// ============================================
export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  deadline?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TASK STATS (matches GET /tasks/stats response)
// Source: MicroDo_Backend/src/controllers/taskController.ts L267-L299
// ============================================
export interface TaskStats {
  total: number;
  todo: number;
  doing: number;
  done: number;
}

// ============================================
// AUTH REQUESTS & RESPONSES
// Source: MicroDo_Backend/src/controllers/authController.ts
// ============================================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    email: string;
    token?: string;
    createdAt?: string;
  };
}

// ============================================
// TASKS RESPONSE (matches GET /tasks response)
// Source: MicroDo_Backend/src/controllers/taskController.ts L123-L135
// ============================================
export interface TasksResponse {
  success: boolean;
  count: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTasks: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  data: Task[];
}

// ============================================
// TASK STATS RESPONSE (matches GET /tasks/stats response)
// Source: MicroDo_Backend/src/controllers/taskController.ts L288-L291
// ============================================
export interface TaskStatsResponse {
  success: boolean;
  data: TaskStats;
}

// ============================================
// API ERROR
// ============================================
export interface ApiError {
  success: boolean;
  message: string;
}
