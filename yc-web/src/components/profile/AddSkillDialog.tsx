import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';

interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  percentage: number;
}

interface AddSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (skill: Skill) => void;
}

const AddSkillDialog = ({ open, onOpenChange, onAdd }: AddSkillDialogProps) => {
  const { register, handleSubmit, control, reset } = useForm<Skill>({
    defaultValues: {
      name: '',
      level: 'Beginner',
      percentage: 30,
    },
  });

  const onSubmit = (data: Skill) => {
    const levelPercentages: Record<Skill['level'], number> = {
      Beginner: 30,
      Intermediate: 65,
      Advanced: 85,
    };

    const skill: Skill = {
      name: data.name.trim(),
      level: data.level,
      percentage: levelPercentages[data.level],
    };

    onAdd(skill);
    toast.success('Skill added successfully!');
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
          {/* Skill Name */}
          <div className="space-y-2">
            <Label htmlFor="skillName">Skill Name</Label>
            <Input
              id="skillName"
              {...register('name', { required: true })}
              placeholder="e.g., React, Python"
            />
          </div>

          {/* Proficiency Level */}
          <div className="space-y-2">
            <Label htmlFor="level">Proficiency Level</Label>
            <Controller
              name="level"
              control={control}
              render={({ field }) => (
                <Select {...field} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Level" />
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

          {/* Footer */}
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
