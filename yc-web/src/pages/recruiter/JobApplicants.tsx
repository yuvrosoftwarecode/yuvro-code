import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, DollarSign, FileText, ExternalLink, User, MapPin, Clock, Building2, Filter, Download } from 'lucide-react';
import { jobService, Job } from '../../services/jobService';
import { jobApplicationService, JobApplication } from '../../services/jobApplicationService';
import RoleSidebar from '../../components/common/RoleSidebar';
import RoleHeader from '../../components/common/RoleHeader';
import { toast } from 'sonner';

const JobApplicants: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (jobId) {
      loadJobDetails();
      loadApplications();
    }
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      const jobData = await jobService.getJob(jobId!);
      setJob(jobData);
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
    }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const applicationsData = await jobApplicationService.getJobApplications(jobId!);
      setApplications(applicationsData.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await jobApplicationService.updateApplicationStatus(applicationId, newStatus);
      toast.success('Application status updated');
      loadApplications(); // Refresh the list
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'shortlisted': return 'bg-green-100 text-green-700 border-green-200';
      case 'interview_scheduled': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'selected': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredApplications = applications.filter(app => 
    selectedStatus === 'all' || app.status === selectedStatus
  );

  const statusOptions = [
    { value: 'applied', label: 'Applied' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interview_scheduled', label: 'Interview Scheduled' },
    { value: 'selected', label: 'Selected' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const headerActions = (
    <>
      <button
        onClick={() => navigate('/recruiter/jobs')}
        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Jobs</span>
      </button>
      <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        <Download className="h-4 w-4" />
        <span>Export Applications</span>
      </button>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <RoleSidebar />
          <div className="flex-1">
            <RoleHeader
              title="Job Applicants"
              subtitle="Loading..."
              actions={headerActions}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading applications...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <RoleSidebar />
        <div className="flex-1">
          <RoleHeader
            title={`Applicants for ${job?.title || 'Job'}`}
            subtitle={`${job?.company.name} • ${filteredApplications.length} applications`}
            actions={headerActions}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Job Summary Card */}
            {job && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        {job.company.name}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.locations.join(', ') || (job.is_remote ? 'Remote' : 'Not specified')}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {job.employment_type.charAt(0).toUpperCase() + job.employment_type.slice(1).replace('-', ' ')}
                      </div>
                    </div>
                    {job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
                    <div className="text-sm text-gray-600">Total Applications</div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Applications</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredApplications.length} of {applications.length} applications
              </div>
            </div>

            {/* Applications List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                  <p className="text-gray-600">
                    {selectedStatus === 'all' 
                      ? 'No one has applied to this job yet.' 
                      : `No applications with status "${getStatusText(selectedStatus)}".`
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredApplications.map((application) => (
                    <div key={application.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {application.applicant_name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{application.applicant_name}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-1" />
                                  {application.applicant_email}
                                </div>
                                {application.applied_at && (
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Applied {new Date(application.applied_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {application.expected_salary && (
                              <div className="flex items-center text-sm text-gray-600">
                                <DollarSign className="h-4 w-4 mr-2" />
                                <span>Expected: {application.expected_salary} {application.expected_currency}</span>
                              </div>
                            )}
                            {application.available_from && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>Available: {new Date(application.available_from).toLocaleDateString()}</span>
                              </div>
                            )}
                            {application.notice_period_days && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>Notice: {application.notice_period_days} days</span>
                              </div>
                            )}
                            {application.portfolio_url && (
                              <div className="flex items-center text-sm text-gray-600">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                <a 
                                  href={application.portfolio_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Portfolio
                                </a>
                              </div>
                            )}
                          </div>

                          {application.cover_letter && (
                            <div className="mb-4">
                              <div className="flex items-center mb-2">
                                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Cover Letter</span>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-700 line-clamp-3">{application.cover_letter}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-3 ml-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                            {getStatusText(application.status)}
                          </span>
                          
                          <select
                            value={application.status}
                            onChange={(e) => handleStatusUpdate(application.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {statusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicants;