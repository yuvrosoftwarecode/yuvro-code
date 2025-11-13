import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, Share2, MapPin, Briefcase, Clock } from 'lucide-react';
import { Job } from '@/pages/student/Jobs';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: Job;
  isSelected: boolean;
  isSaved: boolean;
  isApplied: boolean;
  onClick: () => void;
  onSave: () => void;
}

const JobCard = ({ job, isSelected, isSaved, isApplied, onClick, onSave }: JobCardProps) => {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-md",
        isSelected && "border-primary shadow-md"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
          {job.logo}
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
              <p className="text-sm text-muted-foreground">{job.company}</p>
            </div>
            
            {/* Match Badge */}
            <Badge 
              variant={job.matchPercentage >= 80 ? "default" : "secondary"}
              className="flex-shrink-0"
            >
              {job.matchPercentage}% Match
            </Badge>
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location} • {job.workType}
            </div>
            <div className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {job.experienceLevel}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {job.postedDate}
            </div>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {job.skills.slice(0, 4).map(skill => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {job.skills.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{job.skills.length - 4}
              </Badge>
            )}
          </div>

          {/* Salary & Actions */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-medium text-foreground">
              {job.salaryRange || 'Not disclosed'}
            </span>
            
            <div className="flex items-center gap-2">
              {isApplied && (
                <Badge variant="secondary" className="text-xs">
                  Applied
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                }}
              >
                <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default JobCard;
