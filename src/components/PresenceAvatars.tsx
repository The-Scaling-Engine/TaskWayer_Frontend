import type { PresenceUser } from '@/hooks/useTaskPresence';

interface PresenceAvatarsProps {
  users: PresenceUser[];
}

const MAX_VISIBLE = 4;

export default function PresenceAvatars({ users }: PresenceAvatarsProps) {
  if (users.length === 0) return null;

  const visible = users.slice(0, MAX_VISIBLE);
  const overflow = users.length - MAX_VISIBLE;

  return (
    <div
      className="flex items-center gap-1.5 shrink-0"
      title={users.map((u) => u.name || 'Unknown').join(', ')}
    >
      <span className="text-[11px] text-muted-foreground">Also viewing:</span>
      <div className="flex -space-x-2">
        {visible.map((u) => (
          <div
            key={u.userId}
            title={`${u.name || 'Unknown'}${u.isEditing ? ' (editing)' : ''}`}
            className={`w-7 h-7 rounded-full border-2 border-background overflow-hidden shrink-0 ${
              u.isEditing ? 'ring-2 ring-[#FE812C] ring-offset-1' : ''
            }`}
          >
            {u.avatar ? (
              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                {(u.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {overflow > 0 && (
          <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0">
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}
