import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { invitationService } from '@/services/invitationService';
import { useAuthStore } from '@/store/authStore';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/services/api';

export default function InvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { isAuthenticated, fetchProfile } = useAuthStore();
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [done, setDone] = useState<'accepted' | 'rejected' | null>(null);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      await invitationService.acceptInvitation(token);
      setDone('accepted');
      if (isAuthenticated) {
        await fetchProfile();
        toast.success('Invitation accepted! You have joined the department.');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        toast.success('Invitation accepted! Please log in to continue.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to accept invitation. It may have expired or already been used.'));
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
      toast.error(getApiErrorMessage(err, 'Failed to decline invitation.'));
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
              ? 'You have joined the department. Redirecting to dashboard...'
              : done === 'rejected'
              ? 'You have declined this invitation.'
              : !isAuthenticated
              ? 'Please log in to accept this invitation.'
              : "You've been invited to join a department on Wayer Ops."}
          </p>
        </div>

        {done === 'accepted' ? (
          <div className="flex flex-col items-center gap-2 text-emerald-500">
            <p className="text-sm font-medium">Redirecting to dashboard...</p>
          </div>
        ) : done === 'rejected' ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <p className="text-sm font-medium">Redirecting to home...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                sessionStorage.setItem('pending_invitation', `/invitations/accept?token=${token}`);
                navigate('/login');
              }}
              className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              Log in to Accept Invitation
            </button>
            <p className="text-xs text-muted-foreground">You need to be logged in to accept this invitation.</p>
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
