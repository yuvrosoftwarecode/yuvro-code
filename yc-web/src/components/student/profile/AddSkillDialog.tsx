import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';

interface Skill {
  name: string;
  level: string;
  percentage: number;
}

interface AddSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (skill: Skill) => void;
}

const AddSkillDialog: React.FC<AddSkillDialogProps> = ({ open, onOpenChange, onAdd }) => {
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: {
      name: '',
      level: 'Beginner',
      percentage: 30,
    },
  });

  const onSubmit = (data: any) => {
    const levelPercentages: Record<string, number> = {
      'Beginner': 30,
      'Intermediate': 65,
      'Advanced': 85,
    };
    
    onAdd({
      name: data.name,
      level: data.level,
      percentage: levelPercentages[data.level],
    });
    toast({ title: 'Skill added successfully!' });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Skill</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skillName">Skill Name</Label>
            <Input id="skillName" {...register('name', { required: true })} placeholder="e.g., React, Python" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Proficiency Level</Label>
            <Controller
              name="level"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Skill</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSkillDialog;
