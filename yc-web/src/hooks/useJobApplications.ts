import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Job } from '@/services/jobService';
import { 
  JobApplication, 
  JobApplicationData, 
  jobApplicationService 
} from '@/services/jobApplicationService';

export const useJobApplications = () => {
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [bookmarks, setBookmarks] = useState<JobApplication[]>([]);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchMyApplications = async () => {
    try {
      const applications = await jobApplicationService.getMyApplications();
      setMyApplications(applications || []);
      // Extract job IDs from applications that are not just bookmarked
      const appliedJobIds = new Set(
        applications?.filter(app => app.status !== 'bookmarked')
          .map(app => app.job?.id)
          .filter(Boolean) || []
      );
      setAppliedJobs(appliedJobIds);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setMyApplications([]);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const bookmarkedApps = await jobApplicationService.getBookmarkedJobs();
      setBookmarks(bookmarkedApps || []);
      // Extract job IDs from bookmarked applications
      const bookmarkedJobIds = new Set(
        bookmarkedApps?.filter(app => app.status === 'bookmarked')
          .map(app => app.job?.id)
          .filter(Boolean) || []
      );
      setBookmarkedJobs(bookmarkedJobIds);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setBookmarks([]);
    }
  };

  const handleBookmarkJob = async (jobId: string) => {
    try {
      if (bookmarkedJobs.has(jobId)) {
        await jobApplicationService.removeBookmark(jobId);
        setBookmarkedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        toast.success('Bookmark removed');
      } else {
        await jobApplicationService.bookmarkJob(jobId);
        setBookmarkedJobs(prev => new Set(prev).add(jobId));
        toast.success('Job bookmarked');
      }
      // Refresh both bookmarks and applications to keep data in sync
      await Promise.all([fetchBookmarks(), fetchMyApplications()]);
    } catch (error) {
      console.error('Error bookmarking job:', error);
      toast.error('Failed to bookmark job');
    }
  };

  const handleApplyToJob = async (applicationData: JobApplicationData) => {
    try {
      setLoading(true);
      await jobApplicationService.applyToJob(applicationData);
      setAppliedJobs(prev => new Set(prev).add(applicationData.job_id));
      // Refresh both applications and bookmarks to keep data in sync
      await Promise.all([fetchMyApplications(), fetchBookmarks()]);
      toast.success('Application submitted successfully');
    } catch (error) {
      console.error('Error applying to job:', error);
      toast.error('Failed to submit application');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchMyApplications(), fetchBookmarks()]);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    myApplications,
    bookmarks,
    bookmarkedJobs,
    appliedJobs,
    loading,
    handleBookmarkJob,
    handleApplyToJob,
    refreshData
  };
};

export default useJobApplications;