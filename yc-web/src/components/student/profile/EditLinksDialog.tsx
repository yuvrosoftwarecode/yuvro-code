import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';

interface SocialLinks {
  github: string;
  linkedin: string;
  portfolio: string;
  email: string;
}

interface EditLinksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: SocialLinks;
  onSave: (links: SocialLinks) => void;
}

const EditLinksDialog: React.FC<EditLinksDialogProps> = ({ open, onOpenChange, links, onSave }) => {
  const { register, handleSubmit } = useForm({
    defaultValues: links,
  });

  const onSubmit = (data: SocialLinks) => {
    onSave(data);
    toast({ title: 'Links updated successfully!' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Social Links</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="github">GitHub URL</Label>
            <Input id="github" {...register('github')} placeholder="https://github.com/username" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input id="linkedin" {...register('linkedin')} placeholder="https://linkedin.com/in/username" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio URL</Label>
            <Input id="portfolio" {...register('portfolio')} placeholder="https://yourportfolio.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="your.email@example.com" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Links</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLinksDialog;
