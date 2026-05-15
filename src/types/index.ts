// ============================================
// USER
// ============================================
export interface User {
  _id: string;
  id?: string;
  email: string;
  name?: string;
  avatar?: string;
  username?: string;
  jobTitle?: string;
  role?: 'USER' | 'ADMIN' | 'DEPT_MANAGER' | 'DEPT_MEMBER';
  status?: 'ACTIVE' | 'BANNED';
  createdAt?: string;
}

// ============================================
// TASK
// ============================================
export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  deadline?: string;
  completedAt?: string;
  departmentId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  _count?: { comments: number };
}

// ============================================
// TASK STATS
// ============================================
export interface TaskStats {
  total: number;
  todo: number;
  doing: number;
  done: number;
}

// ============================================
// AUTH
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
    _id?: string;
    email: string;
    token?: string;
    createdAt?: string;
    role?: 'USER' | 'ADMIN' | 'DEPT_MANAGER' | 'DEPT_MEMBER';
  };
}

// ============================================
// TASKS RESPONSE
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

// ============================================
// ADMIN
// ============================================
export interface AdminDashboardStats {
  totalUsers: number;
  bannedUsers: number;
  totalTasks: number;
}

export interface AdminUser {
  _id: string;
  id?: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN' | 'DEPT_MANAGER' | 'DEPT_MEMBER';
  status: 'ACTIVE' | 'BANNED';
  createdAt?: string;
}

export interface AdminUsersResponse {
  success: boolean;
  data: {
    users: AdminUser[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      limit: number;
    };
  };
}

// ============================================
// COMMENTS
// ============================================
export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    username?: string | null;
    avatar?: string | null;
  };
  content: string;
  parentId?: string | null;
  replies?: Comment[];
  totalReplies?: number;
  hasMoreReplies?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CommentsResponse {
  success: boolean;
  count: number;
  data: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// NOTIFICATIONS
// ============================================
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'COMMENT_ADDED'
  | 'MENTIONED_IN_COMMENT'
  | 'TASK_UPDATED'
  | 'DEADLINE_SOON';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
  readAt?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ============================================
// TIME TRACKING
// ============================================
export interface TimeTrackingSession {
  id: string;
  taskId: string;
  profileId: string;
  startedAt: string;
  stoppedAt?: string;
  durationSeconds?: number;
  task?: {
    id: string;
    title: string;
  };
}

export interface TimeSessionsResponse {
  success: boolean;
  data: TimeTrackingSession[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ============================================
// DEPARTMENTS
// ============================================
export type DepartmentMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type DepartmentMemberStatus = 'PENDING' | 'ACTIVE' | 'REMOVED';

export interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    tasks: number;
  };
}

export interface DepartmentMember {
  id: string;
  userId: string;
  departmentId: string;
  role: DepartmentMemberRole;
  status: DepartmentMemberStatus;
  joinedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface DepartmentsResponse {
  success: boolean;
  data: Department[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

export interface DepartmentMembersResponse {
  success: boolean;
  data: DepartmentMember[];
}

// ============================================
// INVITATIONS
// ============================================
export interface DepartmentInvitation {
  id: string;
  departmentId: string;
  email: string;
  role: DepartmentMemberRole;
  token: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt?: string;
}

export interface InvitationsResponse {
  success: boolean;
  data: DepartmentInvitation[];
}

// ============================================
// ANALYTICS
// ============================================
export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionRate: number;
  overdueTasksCount: number;
}

export interface AnalyticsCompletion {
  date: string;
  completed: number;
  total: number;
}

export interface AnalyticsTrend {
  date: string;
  created: number;
  completed: number;
}

export interface AnalyticsHeatmapEntry {
  date: string;
  count: number;
}

export interface AnalyticsTimeEntry {
  totalSeconds: number;
  sessionCount: number;
  avgSessionSeconds: number;
  taskBreakdown?: Array<{
    taskId: string;
    title: string;
    totalSeconds: number;
  }>;
}

// ============================================
// CHART TYPES (giữ lại cho backward compat)
// ============================================
export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface UserGrowthPoint {
  date: string;
  totalUsers: number;
}
