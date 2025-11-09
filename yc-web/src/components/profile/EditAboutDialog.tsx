import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface EditAboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  about: string;
  onSave: (bio: string) => void;
}

const EditAboutDialog: React.FC<EditAboutDialogProps> = ({
  open,
  onOpenChange,
  about,
  onSave,
}) => {
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { bio: about },
  });

  const currentBio = watch('bio');
  const charCount = currentBio?.length || 0;

  const onSubmit = (data: { bio: string }) => {
    onSave(data.bio);
    toast.success('Bio updated successfully!');
    onOpenChange(false);
  };

  React.useEffect(() => {
    reset({ bio: about });
  }, [about, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Bio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Professional Summary</Label>
            <Textarea
              id="bio"
              {...register('bio')}
              rows={6}
              maxLength={500}
              placeholder="Write a short introduction about yourself..."
            />
            <p className="text-xs text-muted-foreground text-right">
              {charCount}/500 characters
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAboutDialog;
