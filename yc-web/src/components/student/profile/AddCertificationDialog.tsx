import React from "react";
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

export interface CertificationForm {
  name: string;
  issuer: string;
  completion_date: string;
  certificate_file?: File | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // null = Add mode, object = Edit mode
  editingData: any | null;

  onSave: (form: CertificationForm) => void;
}

const AddCertificationDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  editingData,
  onSave,
}) => {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: editingData || {
      name: "",
      issuer: "",
      completion_date: "",
    },
  });

  const handleSubmitForm = (data: any) => {
    const payload: CertificationForm = {
      name: data.name,
      issuer: data.issuer,
      completion_date: data.completion_date,
    };

    onSave(payload);
    toast({ title: editingData ? "Certification updated!" : "Certification added!" });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingData ? "Edit Certification" : "Add Certification"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
          <div className="space-y-2">
            <Label>Certification Name</Label>
            <Input {...register("name", { required: true })} />
          </div>

          <div className="space-y-2">
            <Label>Issuer</Label>
            <Input {...register("issuer", { required: true })} />
          </div>

          <div className="space-y-2">
            <Label>Completion Date</Label>
            <Input type="date" {...register("completion_date", { required: true })} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingData ? "Save Changes" : "Add Certification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCertificationDialog;
