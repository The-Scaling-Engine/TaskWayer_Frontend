import api from './api';

export interface TimesheetSummary {
  totalSeconds: number;
  byDay:        { date: string; seconds: number }[];
  byProject:    { projectId: string; name: string; seconds: number }[];
}

export interface TimesheetSession {
  id:              string;
  startedAt:       string;
  stoppedAt:       string | null;
  durationSeconds: number | null;
  task: {
    title:     string;
    projectId: string | null;
    project:   { name: string } | null;
  } | null;
}

export interface TimesheetSessionsData {
  page:     number;
  limit:    number;
  total:    number;
  sessions: TimesheetSession[];
}

interface SummaryParams {
  startDate: string;
  endDate:   string;
  projectId?: string;
}

interface SessionsParams extends SummaryParams {
  page?:  number;
  limit?: number;
}

export const timesheetService = {
  getSummary: async (params: SummaryParams): Promise<{ success: boolean; data: TimesheetSummary }> => {
    const response = await api.get('/timesheet/summary', { params });
    return response.data;
  },

  getSessions: async (params: SessionsParams): Promise<{ success: boolean; data: TimesheetSessionsData }> => {
    const response = await api.get('/timesheet/sessions', { params });
    return response.data;
  },
};
