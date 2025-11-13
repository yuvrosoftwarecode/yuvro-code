import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, ExternalLink, MapPin, Briefcase, DollarSign, HelpCircle, TrendingUp } from 'lucide-react';
import { Job } from '@/pages/student/Jobs';
import { useState } from 'react';
import ApplyModal from './ApplyModal';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface JobDetailProps {
  job: Job;
  onClose: () => void;
  onApply: (jobId: string) => void;
  isApplied: boolean;
  similarJobs: Job[];
  onSelectSimilar: (job: Job) => void;
}

const JobDetail = ({ job, onClose, onApply, isApplied, similarJobs, onSelectSimilar }: JobDetailProps) => {
  const [showApplyModal, setShowApplyModal] = useState(false);

  const handleApply = () => {
    if (!isApplied) {
      setShowApplyModal(true);
    }
  };

  const handleConfirmApply = () => {
    onApply(job.id);
    setShowApplyModal(false);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold truncate">Job Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Section */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center text-3xl flex-shrink-0">
                {job.logo}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground">{job.title}</h1>
                <p className="text-muted-foreground">{job.company}</p>
              </div>
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {job.location} • {job.workType}
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                {job.experienceLevel} • {job.jobType}
              </div>
              {job.salaryRange && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  {job.salaryRange}
                </div>
              )}
            </div>

            {/* Match Score */}
            <Card className="p-4 bg-secondary/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Match Score</p>
                    <p className="text-2xl font-bold text-primary">{job.matchPercentage}%</p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Based on your skills: {job.skills.slice(0, 3).join(', ')}</p>
                    <p className="text-xs mt-1">Missing: TypeScript, Docker</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={handleApply}
                disabled={isApplied}
              >
                {isApplied ? 'Applied' : 'Apply Now'}
              </Button>
              <Button variant="outline">Share</Button>
            </div>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
              <TabsTrigger value="company" className="flex-1">Company</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-6 mt-4">
              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">About the Role</h3>
                <p className="text-sm text-muted-foreground">{job.description}</p>
              </div>

              {/* Responsibilities */}
              <div>
                <h3 className="font-semibold mb-2">Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1">
                  {job.responsibilities.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Required Skills */}
              <div>
                <h3 className="font-semibold mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>

              {/* Preferred Skills */}
              <div>
                <h3 className="font-semibold mb-2">Preferred Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.preferredSkills.map(skill => (
                    <Badge key={skill} variant="outline">{skill}</Badge>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="font-semibold mb-2">Perks & Benefits</h3>
                <div className="flex flex-wrap gap-2">
                  {job.benefits.map(benefit => (
                    <Badge key={benefit} variant="secondary">{benefit}</Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="company" className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-2">About {job.company}</h3>
                <p className="text-sm text-muted-foreground">{job.companyInfo.about}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Company Size</p>
                  <p className="text-sm font-medium">{job.companyInfo.size}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Domain</p>
                  <p className="text-sm font-medium">{job.companyInfo.domain}</p>
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                Visit Website
              </Button>
            </TabsContent>
          </Tabs>

          {/* Similar Jobs */}
          {similarJobs.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Similar Jobs</h3>
                <div className="space-y-3">
                  {similarJobs.map(similarJob => (
                    <Card 
                      key={similarJob.id} 
                      className="p-3 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => onSelectSimilar(similarJob)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-lg">
                          {similarJob.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{similarJob.title}</p>
                          <p className="text-xs text-muted-foreground">{similarJob.company}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {similarJob.matchPercentage}% Match
                            </Badge>
                            <span className="text-xs text-muted-foreground">{similarJob.location}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onConfirm={handleConfirmApply}
        job={job}
      />
    </>
  );
};

export default JobDetail;
