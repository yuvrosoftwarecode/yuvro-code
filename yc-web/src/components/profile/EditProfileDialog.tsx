import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export interface ProfileData {
  name: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  avatar_url?: string;
}

// State type that matches the form data structure
interface ProfileFormData extends Omit<ProfileData, 'avatar_url'> {
  avatar_url: string;
}

// Convert optional fields to required for the form state
const toFormData = (data: ProfileData): ProfileFormData => ({
  ...data,
  avatar_url: data.avatar_url || '',
});

// Convert back to API format with optional fields
const fromFormData = (data: ProfileFormData): ProfileData => ({
  ...data,
  avatar_url: data.avatar_url || undefined,
});

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: ProfileData;
  onSave: (data: ProfileData) => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onOpenChange,
  profileData,
  onSave,
}) => {
  const { register, handleSubmit, reset } = useForm<ProfileFormData>({
    defaultValues: toFormData(profileData),
  });

  const onSubmit = (data: ProfileFormData) => {
    onSave(fromFormData(data));
    toast.success('Profile updated successfully!');
    onOpenChange(false);
  };

  React.useEffect(() => {
    reset(toFormData(profileData));
  }, [profileData, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              {...register('name')}
              disabled
              className="opacity-70 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              disabled
              className="opacity-70 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={4}
              placeholder="Write a short summary about yourself..."
              {...register('bio')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Bangalore, India"
              {...register('location')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website / Portfolio</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourwebsite.com"
              {...register('website')}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;