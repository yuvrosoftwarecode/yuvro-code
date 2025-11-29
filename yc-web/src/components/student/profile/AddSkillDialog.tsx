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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { toast } from "@/hooks/use-toast";

export interface SkillForm {
  name: string;
  level: string;
  percentage: number;
}

interface AddSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // For editing mode
  editingData?: any | null;

  // Callback for Add / Update
  onSave: (skill: SkillForm) => void;
}

const AddSkillDialog: React.FC<AddSkillDialogProps> = ({
  open,
  onOpenChange,
  editingData,
  onSave,
}) => {
  const { register, handleSubmit, control, reset, setValue } =
    useForm<SkillForm>({
      defaultValues: {
        name: "",
        level: "Beginner",
        percentage: 30,
      },
    });

  const LEVEL_PERCENTAGE = {
    Beginner: 30,
    Intermediate: 65,
    Advanced: 85,
  };

  const isEditMode = Boolean(editingData);

  /* ---------------------------------------------- *
   * PREFILL DATA IN EDIT MODE
   * ---------------------------------------------- */
  useEffect(() => {
    if (editingData) {
      setValue("name", editingData.name);
      setValue("level", editingData.level);
      setValue("percentage", editingData.percentage);
    } else {
      reset({
        name: "",
        level: "Beginner",
        percentage: 30,
      });
    }
  }, [editingData, reset, setValue]);

  /* ---------------------------------------------- *
   * SUBMIT HANDLER
   * ---------------------------------------------- */
  const onSubmit = (data: SkillForm) => {
    const percentage = LEVEL_PERCENTAGE[data.level as keyof typeof LEVEL_PERCENTAGE];

    const formattedData = {
      name: data.name,
      level: data.level,
      percentage: percentage,
    };

    onSave(formattedData);

    toast({
      title: isEditMode ? "Skill updated!" : "Skill added!",
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Skill" : "Add Skill"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Skill Name */}
          <div className="space-y-2">
            <Label>Skill Name</Label>
            <Input
              {...register("name", { required: true })}
              placeholder="e.g., React, Python"
            />
          </div>

          {/* Skill Level */}
          <div classname="space-y-2">
            <Label>Proficiency Level</Label>
            <Controller
              name="level"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue(
                      "percentage",
                      LEVEL_PERCENTAGE[value as keyof typeof LEVEL_PERCENTAGE]
                    );
                  }}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? "Save Changes" : "Add Skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSkillDialog;
