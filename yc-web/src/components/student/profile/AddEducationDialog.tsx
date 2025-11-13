import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';

interface Education {
  institution: string;
  degree: string;
  field: string;
  duration: string;
  cgpa: string;
}

interface AddEducationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (education: Education) => void;
}

const AddEducationDialog: React.FC<AddEducationDialogProps> = ({ open, onOpenChange, onAdd }) => {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = (data: any) => {
    onAdd({
      institution: data.institution,
      degree: data.degree,
      field: data.field,
      duration: data.duration,
      cgpa: data.cgpa,
    });
    
    toast({ title: 'Education added successfully!' });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Education</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="institution">Institution/College</Label>
            <Input id="institution" {...register('institution', { required: true })} placeholder="e.g., ABC Institute of Technology" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="degree">Degree</Label>
              <Input id="degree" {...register('degree', { required: true })} placeholder="e.g., Bachelor of Technology" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field">Field of Study</Label>
              <Input id="field" {...register('field', { required: true })} placeholder="e.g., Computer Science" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" {...register('duration', { required: true })} placeholder="e.g., 2021 - 2025" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cgpa">CGPA/Percentage</Label>
              <Input id="cgpa" {...register('cgpa', { required: true })} placeholder="e.g., 8.5" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Education</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEducationDialog;
