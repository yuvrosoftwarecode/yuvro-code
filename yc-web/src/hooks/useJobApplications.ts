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
  const [bookmarkLoading, setBookmarkLoading] = useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [userJobStatus, setUserJobStatus] = useState<Record<string, { is_bookmarked: boolean; is_applied: boolean; status?: string; applied_at?: string }>>({});
  const [loading, setLoading] = useState(false);

  const fetchMyApplications = async () => {
    try {
      const applications = await jobApplicationService.getMyApplications();
      setMyApplications(applications || []);
      // Extract job IDs from applications that are applied (is_applied = true)
      const appliedJobIds = new Set(
        applications?.filter(app => app.is_applied)
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
      console.log('Fetched bookmarks:', bookmarkedApps); // Debug log
      setBookmarks(bookmarkedApps || []);
      // Extract job IDs from bookmarked applications (is_bookmarked = true)
      const bookmarkedJobIds = new Set(
        bookmarkedApps?.filter(app => app.is_bookmarked)
          .map(app => app.job?.id)
          .filter(Boolean) || []
      );
      console.log('Bookmarked job IDs:', Array.from(bookmarkedJobIds)); // Debug log
      setBookmarkedJobs(bookmarkedJobIds);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setBookmarks([]);
    }
  };

  const fetchUserJobStatus = async () => {
    try {
      const status = await jobApplicationService.getUserJobStatus();
      setUserJobStatus(status || {});
      
      // Update local state based on the fetched status
      const bookmarkedJobIds = new Set<string>();
      const appliedJobIds = new Set<string>();
      
      Object.entries(status || {}).forEach(([jobId, jobStatus]) => {
        if (jobStatus.is_bookmarked) {
          bookmarkedJobIds.add(jobId);
        }
        if (jobStatus.is_applied) {
          appliedJobIds.add(jobId);
        }
      });
      
      setBookmarkedJobs(bookmarkedJobIds);
      setAppliedJobs(appliedJobIds);
      
      console.log('User job status updated:', { bookmarkedJobIds: Array.from(bookmarkedJobIds), appliedJobIds: Array.from(appliedJobIds) });
    } catch (error) {
      console.error('Error fetching user job status:', error);
      setUserJobStatus({});
    }
  };

  const handleBookmarkJob = async (jobId: string) => {
    // Prevent concurrent ops on same job
    if (bookmarkLoading.has(jobId)) return;

    // Mark loading
    setBookmarkLoading(prev => new Set(prev).add(jobId));

    // Optimistic update: toggle locally immediately, call API, rollback on error
    const wasBookmarked = bookmarkedJobs.has(jobId);

    // Apply optimistic local update
    setBookmarkedJobs(prev => {
      const newSet = new Set(prev);
      if (wasBookmarked) newSet.delete(jobId);
      else newSet.add(jobId);
      return newSet;
    });

    // Update user job status optimistically
    setUserJobStatus(prev => ({
      ...prev,
      [jobId]: {
        ...prev[jobId],
        is_bookmarked: !wasBookmarked
      }
    }));

    // Update bookmarks array optimistically for immediate UI feedback
    if (wasBookmarked) {
      setBookmarks(prev => prev.filter(bookmark => bookmark.job.id !== jobId));
    }

    try {
      if (wasBookmarked) {
        await jobApplicationService.removeBookmark(jobId);
        toast.success('Job removed from bookmarks', {
          description: 'The job has been removed from your saved jobs.',
          duration: 3000,
        });
      } else {
        await jobApplicationService.bookmarkJob(jobId);
        toast.success('Job bookmarked successfully!', {
          description: 'You can find this job in your Bookmarks tab.',
          duration: 3000,
        });
      }

      // Refresh all data to keep everything in sync
      await Promise.all([fetchBookmarks(), fetchMyApplications(), fetchUserJobStatus()]);
    } catch (error) {
      // Rollback optimistic changes
      setBookmarkedJobs(prev => {
        const newSet = new Set(prev);
        if (wasBookmarked) {
          // we attempted to remove, so re-add on failure
          newSet.add(jobId);
        } else {
          // we attempted to add, so remove on failure
          newSet.delete(jobId);
        }
        return newSet;
      });

      // Rollback user job status
      setUserJobStatus(prev => ({
        ...prev,
        [jobId]: {
          ...prev[jobId],
          is_bookmarked: wasBookmarked
        }
      }));

      // Rollback bookmarks array
      if (!wasBookmarked) {
        await fetchBookmarks(); // Refresh to get correct state
      }

      console.error('Error bookmarking job:', error);
      toast.error(wasBookmarked ? 'Failed to remove bookmark' : 'Failed to bookmark job', {
        description: 'Please try again later.',
        duration: 4000,
      });
    } finally {
      // Clear loading
      setBookmarkLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const handleApplyToJob = async (applicationData: JobApplicationData) => {
    try {
      setLoading(true);
      await jobApplicationService.applyToJob(applicationData);
      
      // Update local state immediately for better UX
      setAppliedJobs(prev => new Set(prev).add(applicationData.job_id));
      setUserJobStatus(prev => ({
        ...prev,
        [applicationData.job_id]: {
          ...prev[applicationData.job_id],
          is_applied: true
        }
      }));
      
      // Trigger job update event for real-time sync
      const event = new CustomEvent('jobUpdate', {
        detail: {
          type: 'job_application_created',
          job_id: applicationData.job_id,
          data: {
            job_title: 'Job Application'
          }
        }
      });
      window.dispatchEvent(event);
      
      // Also trigger a general refresh event
      window.dispatchEvent(new CustomEvent('jobDataRefresh'));
      
      // Refresh all data to keep everything in sync
      await Promise.all([fetchMyApplications(), fetchBookmarks(), fetchUserJobStatus()]);
      toast.success('Application submitted successfully');
    } catch (error: any) {
      console.error('Error applying to job:', error);
      
      // Rollback optimistic update
      setAppliedJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationData.job_id);
        return newSet;
      });
      setUserJobStatus(prev => ({
        ...prev,
        [applicationData.job_id]: {
          ...prev[applicationData.job_id],
          is_applied: false
        }
      }));
      
      // Extract detailed error message
      let errorMessage = 'Failed to submit application';
      if (error?.response?.data) {
        const data = error.response.data;
        // Handle various error response formats
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'object') {
          // Try to extract first field error
          const firstError = Object.values(data)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0] as string;
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
      }
      
      console.log('Detailed error:', error?.response?.data);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchMyApplications(), fetchBookmarks(), fetchUserJobStatus()]);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    myApplications,
    bookmarks,
    bookmarkedJobs,
    appliedJobs,
    userJobStatus,
    loading,
    bookmarkLoading,
    handleBookmarkJob,
    handleApplyToJob,
    refreshData
  };
};

export default useJobApplications;