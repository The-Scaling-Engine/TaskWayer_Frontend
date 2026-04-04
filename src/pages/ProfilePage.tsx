import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/services/userService';
import { toast } from 'sonner';
import { User as UserIcon, Mail, Image as ImageIcon, Loader2, Camera } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const email = user?.email || '';
  const [avatar, setAvatar] = useState(user?.avatar || '');
  
  // Local state for the avatar dialog
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(avatar);

  const [profileLoading, setProfileLoading] = useState(false);

  const handleProfileSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    setProfileLoading(true);
    try {
      const res = await userService.updateProfile({ name, email, avatar: avatar || undefined });
      if (res.success) {
        updateUser(res.data);
        toast.success(res.message || 'Profile updated successfully');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        toast.error(axiosErr.response?.data?.message || 'Failed to update profile');
      } else {
        toast.error('Network error. Please try again.');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAvatarSave = () => {
    setAvatar(tempAvatar);
    setIsAvatarDialogOpen(false);
    // Since state updates are async, we use tempAvatar directly for this save call
    updateProfileWithNewAvatar(tempAvatar);
  };

  const updateProfileWithNewAvatar = async (newAvatar: string) => {
    setProfileLoading(true);
    try {
      const res = await userService.updateProfile({ name, email, avatar: newAvatar || undefined });
      if (res.success) {
        updateUser(res.data);
        toast.success('Avatar updated successfully');
      }
    } catch (err: unknown) {
       toast.error('Failed to update avatar');
    } finally {
      setProfileLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto w-full pt-6 pb-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Profile Information</h1>
        <p className="text-sm text-muted-foreground mt-1">Update your personal details and public profile.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative group cursor-pointer" onClick={() => {
            setTempAvatar(avatar);
            setIsAvatarDialogOpen(true);
          }}>
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-4 border-background shadow-lg transition-transform group-hover:scale-105">
                {name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            
            {/* Hover overlay for changing avatar */}
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="text-white" size={24} />
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-3 hover:text-primary transition-colors cursor-pointer" onClick={() => {
            setTempAvatar(avatar);
            setIsAvatarDialogOpen(true);
          }}>
            Click to change avatar
          </p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-name" className="text-xs font-medium text-foreground">Display Name</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                id="profile-name"
                type="text"
                placeholder="Your display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9 h-11 rounded-lg bg-accent/5 focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-email" className="text-xs font-medium text-foreground">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
              <Input
                id="profile-email"
                type="email"
                value={email}
                disabled
                className="pl-9 h-11 rounded-lg bg-muted text-muted-foreground cursor-not-allowed opacity-100 border-border/50"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Email cannot be changed.</p>
          </div>

          <Button
            type="submit"
            disabled={profileLoading}
            className="w-full h-11 rounded-lg text-sm font-semibold bg-[#FE812C] hover:bg-[#e5732a] text-white shadow-md shadow-[#FE812C]/20 transition-all duration-200 mt-2"
          >
            {profileLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Saving...
              </span>
            ) : (
              'Save Profile'
            )}
          </Button>
        </form>
      </div>

      {/* Avatar Edit Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Avatar</DialogTitle>
            <DialogDescription>
              Enter a new image URL for your profile picture.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="avatar-url">Image URL</Label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="avatar-url"
                  placeholder="https://example.com/image.jpg"
                  value={tempAvatar}
                  onChange={(e) => setTempAvatar(e.target.value)}
                  className="pl-10 h-11 rounded-lg"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)} className="rounded-lg h-10">
              Cancel
            </Button>
            <Button onClick={handleAvatarSave} className="rounded-lg h-10 bg-primary text-primary-foreground hover:bg-primary/90">
              Save Avatar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
