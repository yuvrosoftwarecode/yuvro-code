import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Experience {
  company: string;
  role: string;
  duration: string;
  description: string[];
  technologies: string[];
}

interface AddExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (experience: Experience) => void;
}

const AddExperienceDialog = ({
  open,
  onOpenChange,
  onAdd,
}: AddExperienceDialogProps) => {
  const { register, handleSubmit, reset } = useForm<Experience>();
  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [techInput, setTechInput] = useState('');

  // --- Responsibilities ---
  const addResponsibility = () => {
    if (responsibilities.length < 5) {
      setResponsibilities([...responsibilities, '']);
    }
  };

  const updateResponsibility = (index: number, value: string) => {
    const updated = [...responsibilities];
    updated[index] = value;
    setResponsibilities(updated);
  };

  const removeResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  // --- Technologies ---
  const addTechnology = () => {
    const trimmed = techInput.trim();
    if (trimmed && !technologies.includes(trimmed)) {
      setTechnologies([...technologies, trimmed]);
      setTechInput('');
    }
  };

  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  // --- Form Submit ---
  const onSubmit = (data: Experience) => {
    const filteredResponsibilities = responsibilities.filter((r) => r.trim() !== '');

    if (filteredResponsibilities.length === 0) {
      toast.error('Please add at least one responsibility.');
      return;
    }

    onAdd({
      company: data.company,
      role: data.role,
      duration: data.duration,
      description: filteredResponsibilities,
      technologies,
    });

    toast.success('Experience added successfully!');
    reset();
    setResponsibilities(['']);
    setTechnologies([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Experience</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              {...register('company', { required: true })}
              placeholder="e.g., Tech Solutions Inc."
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role/Designation</Label>
            <Input
              id="role"
              {...register('role', { required: true })}
              placeholder="e.g., Frontend Developer Intern"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              {...register('duration', { required: true })}
              placeholder="e.g., Jun 2024 - Aug 2024"
            />
          </div>

          {/* Responsibilities */}
          <div className="space-y-2">
            <Label>Key Responsibilities (max 5)</Label>
            {responsibilities.map((resp, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  value={resp}
                  onChange={(e) => updateResponsibility(index, e.target.value)}
                  placeholder={`Responsibility ${index + 1}`}
                  rows={2}
                />
                {responsibilities.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeResponsibility(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {responsibilities.length < 5 && (
              <Button type="button" variant="outline" size="sm" onClick={addResponsibility}>
                <Plus className="h-4 w-4 mr-2" />
                Add Responsibility
              </Button>
            )}
          </div>

          {/* Technologies */}
          <div className="space-y-2">
            <Label>Technologies Used</Label>
            <div className="flex gap-2">
              <Input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                placeholder="e.g., React, Node.js"
              />
              <Button type="button" onClick={addTechnology}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {technologies.map((tech) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTechnology(tech)}
                    className="ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Experience</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExperienceDialog;