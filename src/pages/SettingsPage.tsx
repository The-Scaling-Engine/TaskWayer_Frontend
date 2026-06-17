import { useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handlePreSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmNewPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsConfirmOpen(true);
  };

  const executePasswordChange = async () => {
    setIsConfirmOpen(false);
    setPasswordLoading(true);

    try {
      await authService.changePassword(newPassword);
      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to change password'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full pt-6 pb-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Security Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Update your password to keep your account secure.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <form onSubmit={handlePreSubmit} className="space-y-4">
          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="new-password-change" className="text-xs font-medium text-foreground">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                id="new-password-change"
                type={showPasswords ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-9 pr-10 h-11 rounded-lg bg-accent/5 focus-visible:ring-1"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-new-password-change" className="text-xs font-medium text-foreground">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                id="confirm-new-password-change"
                type={showPasswords ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="pl-9 h-11 rounded-lg bg-accent/5 focus-visible:ring-1"
                autoComplete="new-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={passwordLoading}
            className="w-full h-11 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-200 mt-2"
          >
            {passwordLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Changing...
              </span>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-orange-600 dark:text-orange-500" size={24} />
            </div>
            <DialogTitle className="text-center text-xl">Confirm Password Change</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Are you sure you want to change your password? Other active sessions will be signed out.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0 mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} className="w-full sm:w-auto h-11 rounded-xl">
              Cancel
            </Button>
            <Button onClick={executePasswordChange} className="w-full sm:w-auto h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
