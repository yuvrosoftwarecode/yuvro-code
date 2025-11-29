import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";

// Data used when adding/updating
export interface ProjectForm {
  title: string;
  description: string;
  role: string;
  tech_stack: string[];
  github_link?: string | null;
  live_link?: string | null;
}

interface AddProjectDialogProps {
  open: boolean;
  editingData?: any | null; // Project data for edit mode
  onOpenChange: (open: boolean) => void;
  onSave: (project: ProjectForm) => void;
}

const AddProjectDialog: React.FC<AddProjectDialogProps> = ({
  open,
  onOpenChange,
  editingData,
  onSave,
}) => {
  const { register, handleSubmit, reset, setValue } = useForm<ProjectForm>();
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");

  const isEditMode = Boolean(editingData);

  /* ---------------------------------------------- *
   * PREFILL FIELDS IN EDIT MODE
   * ---------------------------------------------- */
  useEffect(() => {
    if (editingData) {
      setValue("title", editingData.title);
      setValue("description", editingData.description);
      setValue("role", editingData.role);
      setValue("github_link", editingData.github_link || "");
      setValue("live_link", editingData.live_link || "");
      setTechStack(editingData.tech_stack || []);
    } else {
      reset();
      setTechStack([]);
    }
  }, [editingData, setValue, reset]);

  /* ---------------------------------------------- *
   * TECH STACK HANDLING
   * ---------------------------------------------- */
  const addTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setTechStack([...techStack, techInput.trim()]);
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
  };

  /* ---------------------------------------------- *
   * SUBMIT HANDLER (ADD or EDIT)
   * ---------------------------------------------- */
  const onSubmit = (data: ProjectForm) => {
    if (techStack.length === 0) {
      toast({
        title: "Tech Stack Required",
        description: "Please add at least one technology.",
        variant: "destructive",
      });
      return;
    }

    const payload: ProjectForm = {
      title: data.title,
      description: data.description,
      role: data.role,
      tech_stack: techStack,
      github_link: data.github_link || null,
      live_link: data.live_link || null,
    };

    onSave(payload);

    toast({
      title: isEditMode ? "Project updated!" : "Project added!",
    });

    reset();
    setTechStack([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Project" : "Add Project"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder="e.g., RideWise App"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description", { required: true })}
              rows={3}
              placeholder="Describe your project..."
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Your Role</Label>
            <Input
              {...register("role", { required: true })}
              placeholder="e.g., Backend Developer"
            />
          </div>

          {/* Tech Stack */}
          <div className="space-y-2">
            <Label>Tech Stack</Label>

            <div className="flex gap-2">
              <Input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTech())
                }
                placeholder="e.g., React, Django, PostgreSQL"
              />
              <Button type="button" onClick={addTech}>
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {techStack.map((tech) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTech(tech)}
                    className="ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>GitHub Link</Label>
              <Input
                {...register("github_link")}
                placeholder="https://github.com/..."
              />
            </div>

            <div>
              <Label>Live Demo Link</Label>
              <Input {...register("live_link")} placeholder="https://..." />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? "Save Changes" : "Add Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectDialog;
