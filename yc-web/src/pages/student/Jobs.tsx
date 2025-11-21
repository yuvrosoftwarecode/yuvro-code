import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import jobsapi, { Job } from "@/services/jobsapi";


interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience_level: string;
  salary: string;
  description: string;
  requirements: string[];
  skills: string[];
  posted_date: string;
  application_deadline: string;
  remote: boolean;
}

const SAMPLE_JOBS: Job[] = [
  {
    id: 1,
    title: 'Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'full-time',
    experience_level: '2-4 years',
    salary: '$80,000 - $120,000',
    description: 'We are looking for a skilled Frontend Developer to join our dynamic team. You will be responsible for developing user-facing web applications using modern JavaScript frameworks.',
    requirements: [
      'Bachelor\'s degree in Computer Science or related field',
      '2+ years of experience with React.js',
      'Strong knowledge of HTML, CSS, and JavaScript',
      'Experience with responsive design and cross-browser compatibility'
    ],
    skills: ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript', 'Git'],
    posted_date: '2024-01-15',
    application_deadline: '2024-02-15',
    remote: true
  },
  {
    id: 2,
    title: 'Backend Developer',
    company: 'DataSoft Solutions',
    location: 'New York, NY',
    type: 'full-time',
    experience_level: '3-5 years',
    salary: '$90,000 - $140,000',
    description: 'Join our backend team to build scalable APIs and microservices. You will work with cloud technologies and help architect our next-generation platform.',
    requirements: [
      'Bachelor\'s degree in Computer Science',
      '3+ years of experience with Node.js or Python',
      'Experience with databases (SQL and NoSQL)',
      'Knowledge of cloud platforms (AWS, GCP, or Azure)'
    ],
    skills: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker'],
    posted_date: '2024-01-12',
    application_deadline: '2024-02-12',
    remote: false
  },
  {
    id: 3,
    title: 'Full Stack Developer Intern',
    company: 'StartupXYZ',
    location: 'Austin, TX',
    type: 'internship',
    experience_level: '0-1 years',
    salary: '$20 - $25/hour',
    description: 'Great opportunity for students or recent graduates to gain hands-on experience in full-stack development. You will work on real projects and learn from experienced developers.',
    requirements: [
      'Currently pursuing or recently completed CS degree',
      'Basic knowledge of web development',
      'Eagerness to learn and grow',
      'Good communication skills'
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS'],
    posted_date: '2024-01-10',
    application_deadline: '2024-02-10',
    remote: true
  }
];

const Jobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>(SAMPLE_JOBS);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(SAMPLE_JOBS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [remoteOnly, setRemoteOnly] = useState(false);

  useEffect(() => {
    filterJobs();
  }, [searchTerm, selectedType, selectedLocation, remoteOnly]);

  const filterJobs = () => {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(job => job.type === selectedType);
    }

    // Location filter
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(job => job.location.includes(selectedLocation));
    }

    // Remote filter
    if (remoteOnly) {
      filtered = filtered.filter(job => job.remote);
    }

    setFilteredJobs(filtered);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'text-green-600 bg-green-100';
      case 'part-time': return 'text-blue-600 bg-blue-100';
      case 'contract': return 'text-purple-600 bg-purple-100';
      case 'internship': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const applyToJob = (jobId: number) => {
    // In a real application, this would handle the job application process
    alert('Application submitted! You will be redirected to the company\'s application portal.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Opportunities</h1>
          <p className="text-gray-600 mt-2">Find your next career opportunity</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Job title, company, or skills..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Locations</option>
                <option value="San Francisco">San Francisco</option>
                <option value="New York">New York</option>
                <option value="Austin">Austin</option>
                <option value="Seattle">Seattle</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Remote only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${getTypeColor(job.type)}
                    `}>
                      {job.type.replace('-', ' ')}
                    </span>
                    {job.remote && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full text-blue-600 bg-blue-100">
                        Remote
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-gray-600 text-sm space-x-4 mb-2">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                      {job.company}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {job.location}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {job.experience}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-green-600 mb-3">{job.salary}</div>
                </div>
                <button
                  onClick={() => applyToJob(job.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Apply Now
                </button>
              </div>

              <p className="text-gray-700 mb-4">{job.description}</p>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {job.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                <div>Posted: {formatDate(job.posted_date)}</div>
                <div>Deadline: {formatDate(job.application_deadline)}</div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
