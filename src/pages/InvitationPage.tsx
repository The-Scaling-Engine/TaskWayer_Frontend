import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { invitationService } from '@/services/invitationService';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

type BE_ERROR = { response?: { data?: { message?: string } } };
const beMsg = (err: unknown, fallback: string) =>
  (err as BE_ERROR)?.response?.data?.message ?? fallback;

export default function InvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [done, setDone] = useState<'accepted' | 'rejected' | null>(null);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      await invitationService.acceptInvitation(token);
      setDone('accepted');
      toast.success('Invitation accepted! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(beMsg(err, 'Failed to accept invitation. It may have expired or already been used.'));
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;
    setRejecting(true);
    try {
      await invitationService.rejectInvitation(token);
      setDone('rejected');
      toast.success('Invitation declined.');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      toast.error(beMsg(err, 'Failed to decline invitation.'));
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-lg text-center space-y-6">
        {/* Icon */}
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          {done === 'accepted' ? (
            <CheckCircle size={32} className="text-emerald-500" />
          ) : done === 'rejected' ? (
            <XCircle size={32} className="text-muted-foreground" />
          ) : (
            <Mail size={32} className="text-primary" />
          )}
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {done === 'accepted'
              ? 'Invitation Accepted!'
              : done === 'rejected'
              ? 'Invitation Declined'
              : 'Department Invitation'}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {done === 'accepted'
              ? 'You have joined the department. Please log in to continue.'
              : done === 'rejected'
              ? 'You have declined this invitation.'
              : "You've been invited to join a department on MicroDo."}
          </p>
        </div>

        {done === 'accepted' ? (
          <div className="flex flex-col items-center gap-2 text-emerald-500">
            <p className="text-sm font-medium">Redirecting to login...</p>
          </div>
        ) : done === 'rejected' ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <p className="text-sm font-medium">Redirecting to home...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleAccept}
              disabled={accepting || rejecting}
              className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {accepting
                ? <Loader2 size={16} className="animate-spin" />
                : <CheckCircle size={16} />}
              Accept Invitation
            </button>
            <button
              onClick={handleReject}
              disabled={accepting || rejecting}
              className="w-full py-3 rounded-xl border border-border text-muted-foreground font-semibold text-sm hover:bg-muted disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {rejecting
                ? <Loader2 size={16} className="animate-spin" />
                : <XCircle size={16} />}
              Decline
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          If you did not expect this invitation, you can safely decline it.
        </p>
      </div>
    </div>
  );
}
