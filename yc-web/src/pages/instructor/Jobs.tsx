import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  description: string;
  requirements: string[];
  postedDate: string;
  status: 'active' | 'closed' | 'draft';
}

const Jobs: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'closed'>('all');
  
  // Sample job data
  const [jobs] = useState<Job[]>([
    {
      id: '1',
      title: 'Senior Full Stack Developer',
      company: 'TechCorp Solutions',
      location: 'Bangalore, India',
      type: 'Full-time',
      experience: '3-5 years',
      salary: '₹12-18 LPA',
      description: 'We are looking for a skilled Full Stack Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies.',
      requirements: ['React.js', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
      postedDate: '2024-11-10',
      status: 'active'
    },
    {
      id: '2',
      title: 'Python Data Scientist',
      company: 'DataTech Analytics',
      location: 'Hyderabad, India',
      type: 'Full-time',
      experience: '2-4 years',
      salary: '₹10-15 LPA',
      description: 'Join our data science team to work on cutting-edge machine learning projects and data analytics solutions.',
      requirements: ['Python', 'Pandas', 'Scikit-learn', 'TensorFlow', 'SQL'],
      postedDate: '2024-11-08',
      status: 'active'
    },
    {
      id: '3',
      title: 'Frontend Developer Intern',
      company: 'StartupXYZ',
      location: 'Remote',
      type: 'Internship',
      experience: '0-1 years',
      salary: '₹15,000/month',
      description: 'Great opportunity for fresh graduates to work on real-world projects and learn from experienced developers.',
      requirements: ['HTML', 'CSS', 'JavaScript', 'React.js'],
      postedDate: '2024-11-05',
      status: 'draft'
    },
    {
      id: '4',
      title: 'DevOps Engineer',
      company: 'CloudTech Systems',
      location: 'Mumbai, India',
      type: 'Full-time',
      experience: '4-6 years',
      salary: '₹15-22 LPA',
      description: 'Looking for an experienced DevOps engineer to manage our cloud infrastructure and CI/CD pipelines.',
      requirements: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform'],
      postedDate: '2024-10-28',
      status: 'closed'
    }
  ]);

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'all') return true;
    return job.status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-red-100 text-red-800'
    };
    return statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800';
  };

  const canManageJobs = user?.role === 'admin' || user?.role === 'instructor';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {user?.role === 'recruiter' 
                    ? 'View and manage job postings' 
                    : 'Manage job postings and applications'
                  }
                </p>
              </div>
              {canManageJobs && (
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  + Add New Job
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'all', label: 'All Jobs', count: jobs.length },
              { key: 'active', label: 'Active', count: jobs.filter(j => j.status === 'active').length },
              { key: 'draft', label: 'Draft', count: jobs.filter(j => j.status === 'draft').length },
              { key: 'closed', label: 'Closed', count: jobs.filter(j => j.status === 'closed').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-2 py-1 text-xs ${
                  activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Jobs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.company}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {job.type} • {job.experience}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  {job.salary}
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4 line-clamp-3">{job.description}</p>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Required Skills:</h4>
                <div className="flex flex-wrap gap-1">
                  {job.requirements.slice(0, 3).map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                      {skill}
                    </span>
                  ))}
                  {job.requirements.length > 3 && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">
                      +{job.requirements.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Posted {new Date(job.postedDate).toLocaleDateString()}
                </span>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Details
                  </button>
                  {canManageJobs && (
                    <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'all' ? 'No jobs have been posted yet.' : `No ${activeTab} jobs found.`}
            </p>
            {canManageJobs && (
              <div className="mt-6">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  + Add New Job
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;