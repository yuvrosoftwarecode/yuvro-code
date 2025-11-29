import React, { useEffect } from "react";
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
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";

export interface EducationForm {
  institution: string;
  degree: string;
  field: string;
  duration: string;
  cgpa?: string | null;
}

interface AddEducationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // For editing mode
  editingData?: any | null;

  // Callback for add/update
  onSave: (education: EducationForm) => void;
}

const AddEducationDialog: React.FC<AddEducationDialogProps> = ({
  open,
  onOpenChange,
  editingData,
  onSave,
}) => {
  const { register, handleSubmit, reset, setValue } = useForm<EducationForm>();

  const isEditMode = Boolean(editingData);

  /* ---------------------------------------------- *
   * PREFILL IN EDIT MODE
   * ---------------------------------------------- */
  useEffect(() => {
    if (editingData) {
      setValue("institution", editingData.institution);
      setValue("degree", editingData.degree);
      setValue("field", editingData.field);
      setValue("duration", editingData.duration);
      setValue("cgpa", editingData.cgpa || "");
    } else {
      reset();
    }
  }, [editingData, setValue, reset]);

  /* ---------------------------------------------- *
   * SUBMIT ADD/UPDATE
   * ---------------------------------------------- */
  const onSubmit = (data: EducationForm) => {
    onSave({
      institution: data.institution,
      degree: data.degree,
      field: data.field,
      duration: data.duration,
      cgpa: data.cgpa || null,
    });

    toast({
      title: isEditMode ? "Education updated!" : "Education added!",
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Education" : "Add Education"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Institution */}
          <div className="space-y-2">
            <Label>Institution / College</Label>
            <Input
              {...register("institution", { required: true })}
              placeholder="e.g., ABC Institute of Technology"
            />
          </div>

          {/* Degree + Field */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Degree</Label>
              <Input
                {...register("degree", { required: true })}
                placeholder="e.g., B.Tech"
              />
            </div>

            <div className="space-y-2">
              <Label>Field of Study</Label>
              <Input
                {...register("field", { required: true })}
                placeholder="e.g., Computer Science"
              />
            </div>
          </div>

          {/* Duration + CGPA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input
                {...register("duration", { required: true })}
                placeholder="2021 - 2025"
              />
            </div>

            <div className="space-y-2">
              <Label>CGPA / Percentage</Label>
              <Input {...register("cgpa")} placeholder="e.g., 8.7" />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? "Save Changes" : "Add Education"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEducationDialog;
