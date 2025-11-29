import React, { useState, useEffect } from "react";
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
import { Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface ExperienceForm {
  company: string;
  role: string;
  duration: string;
  description_list: string[];
  technologies: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSave: (exp: ExperienceForm) => void;
  editingData: ExperienceForm | null; // null = add mode, not null = edit mode
}

const AddExperienceDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  onSave,
  editingData,
}) => {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [duration, setDuration] = useState("");

  const [responsibilities, setResponsibilities] = useState<string[]>([""]);
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");

  // Load edit mode data
  useEffect(() => {
    if (editingData) {
      setCompany(editingData.company);
      setRole(editingData.role);
      setDuration(editingData.duration);
      setResponsibilities(editingData.description_list);
      setTechnologies(editingData.technologies);
    } else {
      setCompany("");
      setRole("");
      setDuration("");
      setResponsibilities([""]);
      setTechnologies([]);
    }
  }, [editingData]);

  const addResponsibility = () => {
    if (responsibilities.length < 5) {
      setResponsibilities([...responsibilities, ""]);
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

  const addTechnology = () => {
    if (techInput.trim() && !technologies.includes(techInput.trim())) {
      setTechnologies([...technologies, techInput.trim()]);
      setTechInput("");
    }
  };

  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  const handleSubmit = () => {
    const filtered = responsibilities.filter((r) => r.trim() !== "");
    if (filtered.length === 0) {
      toast({
        title: "Add at least one responsibility",
        variant: "destructive",
      });
      return;
    }

    const payload: ExperienceForm = {
      company,
      role,
      duration,
      description_list: filtered,
      technologies,
    };

    onSave(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingData ? "Edit Experience" : "Add Experience"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Company</Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Google, Microsoft..."
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Frontend Developer..."
            />
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <Input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Jun 2023 - Aug 2023..."
            />
          </div>

          {/* RESPONSIBILITIES */}
          <div className="space-y-2">
            <Label>Key Responsibilities (max 5)</Label>

            {responsibilities.map((resp, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  value={resp}
                  onChange={(e) =>
                    updateResponsibility(index, e.target.value)
                  }
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addResponsibility}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Responsibility
              </Button>
            )}
          </div>

          {/* TECHNOLOGIES */}
          <div className="space-y-2">
            <Label>Technologies</Label>

            <div className="flex gap-2">
              <Input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTechnology();
                  }
                }}
                placeholder="React, Node.js..."
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
                    className="ml-2"
                    onClick={() => removeTechnology(tech)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editingData ? "Save Changes" : "Add Experience"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddExperienceDialog;
