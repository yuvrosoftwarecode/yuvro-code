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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import profileService from "@/services/profileService";   // ✅ ADD THIS

interface EditProfileData {
  first_name: string;
  last_name: string;
  title: string;
  location: string;
  about: string;
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: EditProfileData;
  onSave: (data: EditProfileData) => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onOpenChange,
  profileData,
  onSave,
}) => {
  const { register, handleSubmit } = useForm({
    defaultValues: profileData,
  });

  const onSubmit = async (data: EditProfileData) => {
  console.log("SUBMIT CALLED!", data);   // 🔥 ADD THIS

  try {
    const updated = await profileService.updateProfile(data);
    onSave(updated);
    toast({ title: "Profile updated successfully!" });
    onOpenChange(false);
  } catch (error: any) {
    console.error("ERROR:", error);  // 🔥 ADD
    toast({
      title: "Update failed",
      description: error?.message || "Something went wrong.",
      variant: "destructive",
    });
  }
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" {...register("first_name")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" {...register("last_name")} />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Professional Title</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g., Java Developer"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="e.g., Bangalore, India"
            />
          </div>

          {/* About / about */}
          <div className="space-y-2">
            <Label htmlFor="about">About / about</Label>
            <Textarea
              id="about"
              {...register("about")}
              placeholder="Write something about yourself..."
              className="min-h-[120px]"
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
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
