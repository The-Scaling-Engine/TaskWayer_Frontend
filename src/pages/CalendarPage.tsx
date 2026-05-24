import { useRef, useState, useCallback, useLayoutEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import { Plus } from 'lucide-react';
import { taskService } from '@/services/taskService';
import { getApiErrorMessage } from '@/services/api';
import type { Task } from '@/types';
import TaskDialog from '@/components/TaskDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function getEventColor(task: Task): string {
  const now = new Date();
  const deadline = task.deadline ? new Date(task.deadline) : null;
  if (task.status === 'done') return '#22c55e';
  if (deadline && deadline < now) return '#ef4444';
  if (task.status === 'doing') return '#f97316';
  return '#3b82f6';
}

function taskToEvent(task: Task): EventInput {
  return {
    id: task._id || task.id,
    title: task.title,
    start: task.scheduledAt ?? undefined,
    display: 'block',
    backgroundColor: getEventColor(task),
    borderColor: getEventColor(task),
    textColor: '#fff',
    extendedProps: { task },
  };
}

function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd}/${yyyy} ${hh}:${min}`;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultDeadline, setDefaultDeadline] = useState<string | undefined>();
  const [defaultScheduledAt, setDefaultScheduledAt] = useState<string | undefined>();
  const [dialogLoading, setDialogLoading] = useState(false);
  const [currentRange, setCurrentRange] = useState<{ from: string; to: string } | null>(null);
  const stickyZoneRef = useRef<HTMLDivElement>(null);
  const [stickyH, setStickyH] = useState(111);

  useLayoutEffect(() => {
    const el = stickyZoneRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStickyH(el.offsetHeight));
    ro.observe(el);
    setStickyH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // 64px = topbar h-16; stickyH = measured height of the page header + legend zone
  const toolbarTop = 64 + stickyH;

  const fetchForRange = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const res = await taskService.getTasks({ scheduledFrom: from, scheduledTo: to, limit: 100 });
      setEvents(res.data.map(taskToEvent));
    } catch {
      // silent — calendar just shows empty
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDatesSet = useCallback((info: DatesSetArg) => {
    const from = info.startStr.substring(0, 10);
    const to = info.endStr.substring(0, 10);
    setCurrentRange({ from, to });
    fetchForRange(from, to);
  }, [fetchForRange]);

  const handleDateClick = (info: DateClickArg) => {
    if (info.allDay) {
      setDefaultScheduledAt(info.dateStr.substring(0, 10));
    } else {
      const d = info.date;
      const pad = (n: number) => String(n).padStart(2, '0');
      setDefaultScheduledAt(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      );
    }
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleEventClick = (info: EventClickArg) => {
    const task = info.event.extendedProps.task as Task;
    setSelectedTask(task);
    setDefaultDeadline(undefined);
    setDefaultScheduledAt(undefined);
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (data: {
    title: string; description: string;
    status: 'todo' | 'doing' | 'done'; deadline?: string;
    priority?: 'low' | 'medium' | 'high'; tags?: string[]; departmentId?: string;
    isRecurring?: boolean;
    recurrenceType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null;
    recurrenceEndDate?: string | null;
  }) => {
    setDialogLoading(true);
    try {
      if (selectedTask) {
        const res = await taskService.updateTask(selectedTask._id || selectedTask.id!, data);
        const updated = res.data;
        const taskId = selectedTask._id || selectedTask.id;
        const dateStr = (updated.scheduledAt ?? updated.createdAt).substring(0, 10);
        const inRange = currentRange ? dateStr >= currentRange.from && dateStr <= currentRange.to : true;
        setEvents(prev => {
          const filtered = prev.filter(ev => ev.id !== taskId);
          return inRange && updated.scheduledAt ? [...filtered, taskToEvent(updated)] : filtered;
        });
        toast.success('Task updated');
      } else {
        const res = await taskService.createTask(data);
        const newTask = res.data;
        if (newTask.isRecurring && currentRange) {
          // Refetch entire range so all pre-generated instances appear immediately
          await fetchForRange(currentRange.from, currentRange.to);
        } else {
          const dateStr = (newTask.scheduledAt ?? newTask.createdAt).substring(0, 10);
          const inRange = currentRange ? dateStr >= currentRange.from && dateStr <= currentRange.to : true;
          if (inRange && newTask.scheduledAt) {
            setEvents(prev => [...prev, taskToEvent(newTask)]);
          }
        }
        toast.success('Task created');
      }
      setDialogOpen(false);
      setSelectedTask(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Operation failed'));
    } finally {
      setDialogLoading(false);
    }
  };

  return (
    <div>
      {/* Sticky zone — page header + legend. No gap between this and calendar card so content can't bleed through. */}
      <div ref={stickyZoneRef} className="sticky top-16 z-10 bg-background -mx-6 px-6 pb-4">
        <div className="flex items-start justify-between pt-2 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">Calendar</h2>
            <p className="text-sm text-muted-foreground">Tasks by scheduled date</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => { setSelectedTask(null); setDefaultDeadline(undefined); setDefaultScheduledAt(undefined); setDialogOpen(true); }}
              className="bg-[#FE812C] hover:bg-[#e5732a] text-white rounded-xl shadow-md shadow-[#FE812C]/20 gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Create Task</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap mt-3">
          {[
            { color: '#3b82f6', label: 'To Do' },
            { color: '#f97316', label: 'In Progress' },
            { color: '#22c55e', label: 'Done' },
            { color: '#ef4444', label: 'Overdue' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar wrapper */}
      <div
        className={cn(
          'rounded-xl border border-border bg-card transition-opacity',
          loading && 'opacity-60 pointer-events-none',
        )}
      >
        <style>{`
          /* ── Base variables (hex-safe, no hsl() wrapper) ── */
          .fc {
            --fc-border-color: var(--border);
            --fc-page-bg-color: transparent;
            --fc-today-bg-color: color-mix(in srgb, var(--primary) 8%, transparent);
            --fc-event-border-color: transparent;
          }

          /* Toolbar */
          .fc .fc-toolbar.fc-header-toolbar {
            padding: 12px 16px; margin: 0;
            border-bottom: 1px solid var(--border);
          }
          .fc .fc-toolbar-title {
            font-size: 1rem; font-weight: 700; color: var(--foreground);
          }

          /* Buttons */
          .fc .fc-button {
            background: var(--muted);
            border: 1px solid var(--border);
            color: var(--foreground);
            border-radius: 0.5rem;
            font-size: 0.75rem; font-weight: 600;
            padding: 0.25rem 0.65rem;
            text-transform: none; box-shadow: none;
            transition: background 0.15s, color 0.15s, border-color 0.15s;
          }
          .fc .fc-button:hover {
            background: color-mix(in srgb, var(--muted) 60%, var(--foreground) 8%);
            border-color: color-mix(in srgb, var(--border) 50%, var(--foreground) 15%);
            color: var(--foreground);
          }
          .fc .fc-button-active,
          .fc .fc-button-primary:not(:disabled).fc-button-active {
            background: color-mix(in srgb, var(--primary) 12%, transparent) !important;
            color: var(--primary) !important;
            border-color: color-mix(in srgb, var(--primary) 35%, transparent) !important;
            box-shadow: none !important;
          }
          .fc .fc-button:focus { box-shadow: none !important; }
          .fc .fc-button-group .fc-button { border-radius: 0; }
          .fc .fc-button-group .fc-button:first-child { border-radius: 0.5rem 0 0 0.5rem; }
          .fc .fc-button-group .fc-button:last-child  { border-radius: 0 0.5rem 0.5rem 0; }

          /* Column headers (SUN MON…) */
          .fc .fc-col-header-cell {
            background: color-mix(in srgb, var(--muted) 60%, transparent);
          }
          .fc .fc-col-header-cell-cushion {
            font-size: 0.72rem; font-weight: 700; letter-spacing: 0.03em;
            color: var(--muted-foreground); text-decoration: none; padding: 6px 4px;
          }

          /* Day cell grid lines */
          .fc-theme-standard td, .fc-theme-standard th { border-color: var(--border); }

          /* Day number (normal days) */
          .fc .fc-daygrid-day-number {
            font-size: 0.75rem; font-weight: 500;
            color: var(--muted-foreground); text-decoration: none;
            padding: 4px 6px;
            border-radius: 50%;
            min-width: 26px; height: 26px;
            display: inline-flex; align-items: center; justify-content: center;
            transition: background 0.12s, color 0.12s;
          }

          /* Day hover — highlight the date number */
          .fc .fc-daygrid-day:not(.fc-day-other):not(.fc-day-today):hover .fc-daygrid-day-number {
            background: color-mix(in srgb, var(--primary) 10%, transparent);
            color: var(--primary);
          }

          /* Other-month days — dimmed */
          .fc .fc-day-other .fc-daygrid-day-number { opacity: 0.3; }

          /* ── TODAY — prominent circle on the number ── */
          .fc .fc-daygrid-day.fc-day-today {
            background: color-mix(in srgb, var(--primary) 7%, transparent) !important;
          }
          .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
            background: var(--primary);
            color: var(--primary-foreground);
            font-weight: 700;
          }
          .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number:hover {
            background: color-mix(in srgb, var(--primary) 85%, var(--foreground) 15%);
            color: var(--primary-foreground);
          }

          /* Events */
          .fc .fc-event {
            border-radius: 4px; font-size: 0.72rem; padding: 0 4px;
            cursor: pointer; transition: opacity 0.12s, transform 0.12s;
            opacity: 1;
          }
          .fc .fc-event:hover { opacity: 0.85; transform: translateY(-1px); }
          .fc .fc-event-main { background: transparent !important; }

          /* Week/Day time grid */
          .fc .fc-timegrid-slot { height: 2rem; }
          .fc .fc-timegrid-axis-cushion {
            font-size: 0.68rem; color: var(--muted-foreground);
          }

          /* List view */
          .fc .fc-list-event-title { font-size: 0.8rem; }
          .fc .fc-list-event:hover td {
            background: color-mix(in srgb, var(--muted) 80%, transparent) !important;
            cursor: pointer;
          }
          .fc .fc-list-day-cushion {
            background: color-mix(in srgb, var(--muted) 60%, transparent);
          }
          .fc .fc-list-empty {
            background: transparent; color: var(--muted-foreground); font-size: 0.875rem;
          }

          /* Misc */
          .fc .fc-daygrid-day-frame { min-height: 80px; }

          /* ── Sticky toolbar & column headers ── */
          .fc .fc-toolbar.fc-header-toolbar {
            position: sticky;
            top: ${toolbarTop}px;
            z-index: 9;
            background: var(--card);
          }
          .fc .fc-col-header-cell {
            position: sticky;
            top: ${toolbarTop + 57}px;
            z-index: 8;
            background: color-mix(in srgb, var(--muted) 60%, transparent);
          }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day', list: 'Agenda' }}
          events={events}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          navLinks={true}
          allDaySlot={false}
          dayMaxEvents={3}
          height="auto"
          aspectRatio={1.9}
          eventContent={(info) => {
            const task = info.event.extendedProps.task as Task;
            return (
              <div
                className={cn('truncate px-1 text-white text-[11px] font-medium', task.status === 'done' && 'line-through opacity-80')}
                title={info.event.title}
              >
                {info.event.title}
              </div>
            );
          }}
          eventDidMount={(info) => {
            const task = info.event.extendedProps.task as Task;
            info.el.title = `${task.title}\nStatus: ${task.status}\nPriority: ${task.priority}\nScheduled: ${formatCreatedAt(task.scheduledAt ?? task.createdAt)}`;
          }}
        />
      </div>

      <TaskDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelectedTask(null); setDefaultScheduledAt(undefined); }}
        onSubmit={handleDialogSubmit}
        task={selectedTask}
        loading={dialogLoading}
        defaultDeadline={defaultDeadline}
        defaultScheduledAt={defaultScheduledAt}
      />
    </div>
  );
}
