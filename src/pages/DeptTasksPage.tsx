import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import KanbanBoard from '@/components/KanbanBoard';
import type { KanbanBoardRef } from '@/components/KanbanBoard';
import { Button } from '@/components/ui/button';
import { useTaskStore } from '@/store/taskStore';
import { useDepartmentStore } from '@/store/departmentStore';

export default function DeptTasksPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const boardRef = React.useRef<KanbanBoardRef>(null);
  const { resetParams } = useTaskStore();
  const allMemberships = useDepartmentStore((s) => s.allMemberships);

  const deptName = departmentId
    ? allMemberships.find((m) => m.department.id === departmentId)?.department.name
    : undefined;

  React.useEffect(() => {
    if (departmentId) {
      resetParams({ departmentId });
    }
  }, [departmentId, resetParams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {deptName ? `${deptName} — Tasks` : 'Department Tasks'}
            </h2>
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
        <Button
          onClick={() => boardRef.current?.openCreateTask()}
          className="bg-[#FE812C] hover:bg-[#e5732a] text-white rounded-xl shadow-md shadow-[#FE812C]/20 gap-2"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Create Task</span>
        </Button>
      </div>

      <KanbanBoard ref={boardRef} hideDeptLabel />
    </div>
  );
}
