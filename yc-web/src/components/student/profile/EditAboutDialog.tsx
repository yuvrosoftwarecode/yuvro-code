import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';

interface EditAboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  about: string;
  onSave: (about: string) => void;
}

const EditAboutDialog: React.FC<EditAboutDialogProps> = ({ open, onOpenChange, about, onSave }) => {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: { about },
  });

  const currentAbout = watch('about');
  const charCount = currentAbout?.length || 0;

  const onSubmit = (data: { about: string }) => {
    onSave(data.about);
    toast({ title: 'About section updated successfully!' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit About</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="about">Professional Summary</Label>
            <Textarea 
              id="about" 
              {...register('about')} 
              rows={6}
              maxLength={500}
              placeholder="Write a brief professional summary about yourself..."
            />
            <p className="text-xs text-muted-foreground text-right">{charCount}/500 characters</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
