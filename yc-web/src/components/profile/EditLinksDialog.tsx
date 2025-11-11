import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface SocialLinks {
  github: string;
  linkedin: string;
  portfolio: string;
  email: string;
}

interface EditLinksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: SocialLinks;
  onSave: (links: SocialLinks) => void;
}

const EditLinksDialog = ({
  open,
  onOpenChange,
  links,
  onSave,
}: EditLinksDialogProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SocialLinks>({
    defaultValues: links,
  });

  const onSubmit = (data: SocialLinks) => {
    onSave(data);
    toast.success('Links updated successfully!');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Social Links</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* GitHub */}
          <div className="space-y-2">
            <Label htmlFor="github">GitHub URL</Label>
            <Input
              id="github"
              {...register('github', {
                pattern: {
                  value: /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+\/?$/,
                  message: 'Enter a valid GitHub URL',
                },
              })}
              placeholder="https://github.com/username"
            />
            {errors.github && (
              <p className="text-xs text-red-500">{errors.github.message}</p>
            )}
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input
              id="linkedin"
              {...register('linkedin', {
                pattern: {
                  value: /^https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?$/,
                  message: 'Enter a valid LinkedIn URL',
                },
              })}
              placeholder="https://linkedin.com/in/username"
            />
            {errors.linkedin && (
              <p className="text-xs text-red-500">{errors.linkedin.message}</p>
            )}
          </div>

          {/* Portfolio */}
          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio URL</Label>
            <Input
              id="portfolio"
              {...register('portfolio', {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Enter a valid URL (starting with http/https)',
                },
              })}
              placeholder="https://yourportfolio.com"
            />
            {errors.portfolio && (
              <p className="text-xs text-red-500">{errors.portfolio.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address',
                },
              })}
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
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
            <Button type="submit">Save Links</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLinksDialog;
