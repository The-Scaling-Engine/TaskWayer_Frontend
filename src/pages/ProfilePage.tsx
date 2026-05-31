import { useState, useRef, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/services/userService';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';
import {
  User as UserIcon, Mail, Image as ImageIcon, Loader2, Camera,
  AtSign, Briefcase, Upload, Link, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDepartmentStore } from '@/store/departmentStore';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUDNAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

async function uploadToCloudinary(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('Cloudinary not configured');
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json() as { secure_url?: string; error?: { message: string } };
  if (!res.ok || !data.secure_url) throw new Error(data.error?.message ?? 'Upload failed');
  return data.secure_url;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const myDepartments = useDepartmentStore((s) => s.myDepartments);
  const activeDept = myDepartments.find((m) => m.role === 'MEMBER');

  const [name, setName] = useState(user?.name || '');
  const email = user?.email || '';
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [username, setUsername] = useState(user?.username || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');

  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'upload' | 'url'>('upload');
  const [tempAvatar, setTempAvatar] = useState(avatar);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileLoading, setProfileLoading] = useState(false);

  const openAvatarDialog = () => {
    setTempAvatar(avatar);
    setSelectedFile(null);
    setFilePreview('');
    setAvatarTab('upload');
    setIsAvatarDialogOpen(true);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be smaller than 5 MB'); return; }
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleAvatarSave = async () => {
    if (avatarTab === 'upload' && selectedFile) {
      if (!CLOUD_NAME || !UPLOAD_PRESET) {
        toast.error('Cloudinary is not configured. Please contact admin.');
        return;
      }
      setUploadLoading(true);
      try {
        const url = await uploadToCloudinary(selectedFile);
        setAvatar(url);
        setIsAvatarDialogOpen(false);
        await saveProfile({ avatarOverride: url });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploadLoading(false);
      }
    } else {
      setAvatar(tempAvatar);
      setIsAvatarDialogOpen(false);
      await saveProfile({ avatarOverride: tempAvatar });
    }
  };

  const saveProfile = async ({ avatarOverride }: { avatarOverride?: string } = {}) => {
    setProfileLoading(true);
    try {
      const res = await userService.updateProfile({
        name, email,
        avatar: (avatarOverride ?? avatar) || undefined,
        username: username || undefined,
        jobTitle: jobTitle || undefined,
      });
      if (res.success) {
        updateUser(res.data);
        toast.success(res.message || 'Profile updated successfully');
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    await saveProfile();
  };

  const avatarLetter = (name?.charAt(0) || email?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="max-w-4xl mx-auto w-full pt-4">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex">

        {/* ── Left panel: avatar + identity ── */}
        <div className="w-64 shrink-0 flex flex-col items-center px-8 py-10 border-r border-border bg-muted/20">
          <div className="relative group cursor-pointer" onClick={openAvatarDialog}>
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-4 border-background shadow-lg transition-transform group-hover:scale-105">
                {avatarLetter}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="text-white" size={20} />
            </div>
          </div>

          <p className="font-bold text-foreground text-center mt-3 text-sm leading-tight break-all">
            {name || 'Your Name'}
          </p>
          <p className="text-[11px] text-muted-foreground text-center mt-0.5 break-all">{email}</p>
          {jobTitle && (
            <p className="text-[11px] text-muted-foreground/70 text-center mt-0.5">{jobTitle}</p>
          )}
          {activeDept && (
            <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/50">
              <Building2 size={12} className="text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate">{activeDept.department.name}</span>
            </div>
          )}

          <button
            type="button"
            onClick={openAvatarDialog}
            className="mt-4 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Camera size={12} />
            Change avatar
          </button>
        </div>

        {/* ── Right panel: form ── */}
        <form onSubmit={handleProfileSubmit} className="flex-1 p-6 flex flex-col gap-5">
          <div>
            <h2 className="font-semibold text-foreground text-base">Profile Information</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Update your personal details and public profile.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Display Name */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-name" className="text-xs font-medium text-foreground">Display Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  id="profile-name"
                  type="text"
                  placeholder="Your display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-8 h-9 rounded-lg bg-accent/5 focus-visible:ring-1 text-sm"
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-username" className="text-xs font-medium text-foreground">Username</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  id="profile-username"
                  type="text"
                  placeholder="@username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-8 h-9 rounded-lg bg-accent/5 focus-visible:ring-1 text-sm"
                />
              </div>
            </div>

            {/* Job Title */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-jobtitle" className="text-xs font-medium text-foreground">Job Title</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  id="profile-jobtitle"
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="pl-8 h-9 rounded-lg bg-accent/5 focus-visible:ring-1 text-sm"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-email" className="text-xs font-medium text-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  disabled
                  className="pl-8 h-9 rounded-lg bg-muted text-muted-foreground cursor-not-allowed border-border/50 text-sm"
                />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground -mt-1">
            Username: 3–30 chars, letters/numbers/underscores only. Email cannot be changed.
          </p>

          <div className="flex justify-end mt-auto">
            <Button
              type="submit"
              disabled={profileLoading}
              className="px-6 h-10 rounded-lg text-sm font-semibold bg-[#FE812C] hover:bg-[#e5732a] text-white shadow-md shadow-[#FE812C]/20 transition-all duration-200"
            >
              {profileLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={14} />
                  Saving...
                </span>
              ) : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Avatar Dialog ── */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Avatar</DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-border mb-4">
            {(['upload', 'url'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAvatarTab(tab)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                  avatarTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab === 'upload' ? <><Upload size={13} /> Upload File</> : <><Link size={13} /> Image URL</>}
              </button>
            ))}
          </div>

          {/* Upload tab */}
          {avatarTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />

              {filePreview ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={filePreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-border shadow" />
                  <p className="text-xs text-muted-foreground">{selectedFile?.name}</p>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setFilePreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors',
                    isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon size={20} className="text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Drop image here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, GIF, WEBP — max 5 MB</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* URL tab */}
          {avatarTab === 'url' && (
            <div className="space-y-3">
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={tempAvatar}
                  onChange={(e) => setTempAvatar(e.target.value)}
                  className="pl-10 h-10 rounded-lg"
                  autoFocus
                />
              </div>
              {tempAvatar && (
                <div className="flex justify-center">
                  <img
                    src={tempAvatar}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-4 border-border shadow"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsAvatarDialogOpen(false)}
              className="rounded-lg h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAvatarSave}
              disabled={uploadLoading || (avatarTab === 'upload' && !selectedFile) || (avatarTab === 'url' && !tempAvatar.trim())}
              className="rounded-lg h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {uploadLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin" /> Uploading...
                </span>
              ) : 'Save Avatar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
