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
  id?: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  deadline?: string;
  scheduledAt?: string | null;
  completedAt?: string;
  departmentId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isRecurring?: boolean;
  recurrenceType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null;
  recurrenceEndDate?: string | null;
  recurrenceParentId?: string | null;
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
// TODO
// ============================================
export interface Todo {
  id: string;
  profileId: string;
  text: string;
  done: boolean;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
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
  status: 'PENDING' | 'ACTIVE' | 'BANNED';
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
  | 'DEADLINE_SOON'
  | 'DEADLINE_3_DAYS'
  | 'DEADLINE_2_DAYS'
  | 'DEADLINE_1_DAY'
  | 'DEADLINE_12_HOURS'
  | 'DEADLINE_4_HOURS'
  | 'DEADLINE_1_HOUR';

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
    members?: number;
    memberships?: number;
    tasks?: number;
  };
}

export interface DepartmentMember {
  id: string;
  userId: string;
  departmentId: string;
  role: DepartmentMemberRole;
  status: DepartmentMemberStatus;
  joinedAt: string;
  invitedBy?: string | null;
  profile?: {
    id: string;
    email: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
    jobTitle?: string | null;
  };
}

export interface DepartmentWithMembers extends Department {
  memberships: DepartmentMember[];
  hasMoreMembers: boolean;
}

export interface DepartmentsResponse {
  success: boolean;
  count: number;
  data: DepartmentWithMembers[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DepartmentMembersResponse {
  success: boolean;
  count: number;
  data: DepartmentMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
// MY DEPARTMENT MEMBERSHIPS
// ============================================
export interface MyDepartmentMembership {
  id: string;
  role: DepartmentMemberRole;
  status: DepartmentMemberStatus;
  joinedAt: string;
  department: { id: string; name: string; description?: string };
}

export interface MemberWorkload {
  memberId: string;
  profile: {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
    avatar: string | null;
    jobTitle: string | null;
  };
  role: DepartmentMemberRole;
  tasks: {
    total: number;
    todo: number;
    doing: number;
    done: number;
    overdue: number;
    highPriority: number;
    nearDeadline: number;
  };
  hasActiveSession: boolean;
}

export interface WorkloadResponse {
  success: boolean;
  count: number;
  data: MemberWorkload[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ActiveSessionResponse {
  success: boolean;
  data: {
    hasActiveSession: boolean;
    session: {
      id: string;
      startedAt: string;
      task: { id: string; title: string; priority: string; status: string; deadline: string | null };
    } | null;
  };
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
  dayOfWeek: number;
  hour: number;
  created: number;
  completed: number;
  total: number;
}

export interface AnalyticsTimeEntry {
  timezone: string;
  period: { startDate: string; endDate: string };
  summary: {
    totalDurationSeconds: number;
    sessionCount: number;
    averageSessionSeconds: number | null;
  };
  byTask: Array<{
    taskId: string;
    title: string;
    totalDurationSeconds: number;
    sessionCount: number;
  }>;
}

// ============================================
// ADMIN ANALYTICS
// ============================================
export interface AdminAnalyticsSummary {
  timezone: string;
  users: { total: number; active: number; banned: number; };
  tasks: { total: number; todo: number; doing: number; done: number; overdue: number; dueSoon: number; createdToday: number; };
  departments: { total: number; };
  comments: { total: number; };
}

export interface AdminAnalyticsDeptItem {
  id: string;
  name: string;
  tasks: { total: number; };
  members: { active: number; };
}

export interface AdminAnalyticsDepartmentsResponse {
  page: number;
  limit: number;
  total: number;
  departments: AdminAnalyticsDeptItem[];
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
