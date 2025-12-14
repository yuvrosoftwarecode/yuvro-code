import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Briefcase, DollarSign, BookmarkIcon, Share2, Filter, X } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { jobService, Job } from '@/services/jobService';

interface JobFilters {
  location: string[];
  experienceLevel: string[];
  jobType: string[];
  salaryRange: string[];
  currency: string[];
  skills: string[];
  companySize: string[];
  educationLevel: string[];
  noticePeriod: string[];
  postedDate: string;
}

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [myApplicationsCount, setMyApplicationsCount] = useState(0);
  
  const [filters, setFilters] = useState<JobFilters>({
    location: [],
    experienceLevel: [],
    jobType: [],
    salaryRange: [],
    currency: [],
    skills: [],
    companySize: [],
    educationLevel: [],
    noticePeriod: [],
    postedDate: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, searchQuery, filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const jobsData = await jobService.getAllJobs();
      const activeJobs = jobsData.filter(job => job.status === 'active');
      setJobs(activeJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = jobs;

    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filters.location.length > 0) {
      filtered = filtered.filter(job => {
        if (filters.location.includes('Remote') && job.is_remote) return true;
        if (filters.location.includes('Hybrid') && job.locations.length > 0 && job.is_remote) return true;
        if (filters.location.includes('Onsite') && job.locations.length > 0 && !job.is_remote) return true;
        return job.locations.some(loc => 
          filters.location.some(filterLoc => 
            loc.toLowerCase().includes(filterLoc.toLowerCase())
          )
        );
      });
    }

    if (filters.experienceLevel.length > 0) {
      filtered = filtered.filter(job => {
        if (filters.experienceLevel.includes('Fresher') && job.experience_min_years === 0) return true;
        if (filters.experienceLevel.includes('0-2 yrs') && job.experience_min_years <= 2) return true;
        if (filters.experienceLevel.includes('2-5 yrs') && job.experience_min_years >= 2 && job.experience_min_years <= 5) return true;
        if (filters.experienceLevel.includes('5+ yrs') && job.experience_min_years >= 5) return true;
        return false;
      });
    }

    if (filters.jobType.length > 0) {
      filtered = filtered.filter(job => 
        filters.jobType.some(type => 
          job.employment_type.toLowerCase().replace('-', ' ') === type.toLowerCase()
        )
      );
    }

    if (filters.salaryRange.length > 0) {
      filtered = filtered.filter(job => {
        if (!job.min_salary) return false;
        return filters.salaryRange.some(range => {
          switch (range) {
            case '0-5':
              return job.min_salary <= 500000;
            case '5-10':
              return job.min_salary >= 500000 && job.min_salary <= 1000000;
            case '10-15':
              return job.min_salary >= 1000000 && job.min_salary <= 1500000;
            case '15-25':
              return job.min_salary >= 1500000 && job.min_salary <= 2500000;
            case '25+':
              return job.min_salary >= 2500000;
            default:
              return true;
          }
        });
      });
    }

    if (filters.currency.length > 0) {
      filtered = filtered.filter(job => 
        filters.currency.includes(job.currency)
      );
    }

    if (filters.skills.length > 0) {
      filtered = filtered.filter(job => 
        filters.skills.some(skill => 
          job.skills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    if (filters.companySize.length > 0) {
      filtered = filtered.filter(job => 
        filters.companySize.some(size => 
          job.company.size === size
        )
      );
    }

    if (filters.educationLevel.length > 0) {
      filtered = filtered.filter(job => 
        filters.educationLevel.includes(job.education_level)
      );
    }

    if (filters.noticePeriod.length > 0) {
      filtered = filtered.filter(job => {
        if (!job.notice_period) return filters.noticePeriod.includes('flexible');
        return filters.noticePeriod.some(period => {
          switch (period) {
            case 'immediate':
              return job.notice_period <= 7;
            case '15-days':
              return job.notice_period <= 15;
            case '30-days':
              return job.notice_period <= 30;
            case '60-days':
              return job.notice_period <= 60;
            case '90-days':
              return job.notice_period <= 90;
            case 'flexible':
              return true;
            default:
              return true;
          }
        });
      });
    }

    // Posted date filter
    if (filters.postedDate) {
      const now = new Date();
      filtered = filtered.filter(job => {
        if (!job.posted_at) return false;
        const postedDate = new Date(job.posted_at);
        const diffTime = Math.abs(now.getTime() - postedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (filters.postedDate) {
          case 'today':
            return diffDays <= 1;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          case 'all':
          default:
            return true;
        }
      });
    }

    setFilteredJobs(filtered);
  };

  const toggleFilter = (filterType: keyof JobFilters, value: string) => {
    setFilters(prev => {
      const currentFilter = prev[filterType];
      if (Array.isArray(currentFilter)) {
        const newFilter = currentFilter.includes(value)
          ? currentFilter.filter(item => item !== value)
          : [...currentFilter, value];
        return { ...prev, [filterType]: newFilter };
      }
      return prev;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      location: [],
      experienceLevel: [],
      jobType: [],
      salaryRange: [],
      currency: [],
      skills: [],
      companySize: [],
      educationLevel: [],
      noticePeriod: [],
      postedDate: ''
    });
  };

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(jobId)) {
        newSaved.delete(jobId);
      } else {
        newSaved.add(jobId);
      }
      return newSaved;
    });
  };

  const handleApplyToJob = async (jobId: string) => {
    try {
      await jobService.applyToJob(jobId);
      setMyApplicationsCount(prev => prev + 1);
      // You might want to show a success message here
    } catch (error) {
      console.error('Error applying to job:', error);
      // You might want to show an error message here
    }
  };

  const getExperienceText = (job: Job) => {
    if (job.experience_min_years === 0) return 'Fresher';
    if (job.experience_max_years) {
      return `${job.experience_min_years}-${job.experience_max_years} yrs`;
    }
    return `${job.experience_min_years}+ yrs`;
  };

  const getSalaryText = (job: Job) => {
    if (!job.min_salary && !job.max_salary) return null;
    const currency = job.currency === 'INR' ? '₹' : '$';
    if (job.min_salary && job.max_salary) {
      return `${currency}${job.min_salary}-${job.max_salary} LPA`;
    }
    if (job.min_salary) {
      return `${currency}${job.min_salary}+ LPA`;
    }
    return `Up to ${currency}${job.max_salary} LPA`;
  };

  const getLocationText = (job: Job) => {
    if (job.is_remote && job.locations.length > 0) {
      return `${job.locations[0]} • Hybrid`;
    }
    if (job.is_remote) {
      return 'Remote';
    }
    if (job.locations.length > 0) {
      return `${job.locations[0]} • Onsite`;
    }
    return 'Location not specified';
  };

  const getPostedTime = (postedAt: string) => {
    const now = new Date();
    const posted = new Date(postedAt);
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  const getMatchPercentage = (job: Job) => {
    // Simple matching algorithm based on skills
    // In a real app, this would be more sophisticated
    const userSkills = ['React', 'TypeScript', 'JavaScript']; // This would come from user profile
    const matchingSkills = job.skills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase() === skill.toLowerCase()
      )
    );
    const percentage = Math.min(Math.round((matchingSkills.length / Math.max(job.skills.length, 1)) * 100), 100);
    return Math.max(percentage, 60); // Minimum 60% for demo purposes
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading job opportunities...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear All Filters
                  </button>
                </div>

                {/* Location Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Location</h4>
                  <div className="space-y-2">
                    {['Remote', 'Hybrid', 'Onsite'].map(location => (
                      <label key={location} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.location.includes(location)}
                          onChange={() => toggleFilter('location', location)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{location}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience Level Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Experience Level</h4>
                  <div className="space-y-2">
                    {['Fresher', '0-2 yrs', '2-5 yrs', '5+ yrs'].map(level => (
                      <label key={level} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.experienceLevel.includes(level)}
                          onChange={() => toggleFilter('experienceLevel', level)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Job Type Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Job Type</h4>
                  <div className="space-y-2">
                    {['Full-time', 'Part-time', 'Contract', 'Internship'].map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.jobType.includes(type)}
                          onChange={() => toggleFilter('jobType', type)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Salary Range Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Salary Range (LPA)</h4>
                  <div className="space-y-2">
                    {[
                      { value: '0-5', label: '0-5 LPA' },
                      { value: '5-10', label: '5-10 LPA' },
                      { value: '10-15', label: '10-15 LPA' },
                      { value: '15-25', label: '15-25 LPA' },
                      { value: '25+', label: '25+ LPA' }
                    ].map(range => (
                      <label key={range.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.salaryRange.includes(range.value)}
                          onChange={() => toggleFilter('salaryRange', range.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Currency Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Currency</h4>
                  <div className="space-y-2">
                    {['INR', 'USD', 'EUR', 'GBP'].map(currency => (
                      <label key={currency} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.currency.includes(currency)}
                          onChange={() => toggleFilter('currency', currency)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{currency}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Skills Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Skills</h4>
                  <div className="space-y-2">
                    {['React', 'JavaScript', 'Python', 'Java', 'Node.js', 'TypeScript', 'AWS', 'Docker'].map(skill => (
                      <label key={skill} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.skills.includes(skill)}
                          onChange={() => toggleFilter('skills', skill)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Company Size Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Company Size</h4>
                  <div className="space-y-2">
                    {[
                      { value: '1-10', label: 'Startup (1-10)' },
                      { value: '11-50', label: 'Small (11-50)' },
                      { value: '51-200', label: 'Medium (51-200)' },
                      { value: '201-500', label: 'Large (201-500)' },
                      { value: '501-1000', label: 'Enterprise (501-1000)' },
                      { value: '1000+', label: 'Corporation (1000+)' }
                    ].map(size => (
                      <label key={size.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.companySize.includes(size.value)}
                          onChange={() => toggleFilter('companySize', size.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{size.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Education Level Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Education Level</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'high_school', label: 'High School' },
                      { value: 'diploma', label: 'Diploma' },
                      { value: 'bachelor', label: 'Bachelor\'s Degree' },
                      { value: 'master', label: 'Master\'s Degree' },
                      { value: 'phd', label: 'PhD' },
                      { value: 'any', label: 'Any' }
                    ].map(level => (
                      <label key={level.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.educationLevel.includes(level.value)}
                          onChange={() => toggleFilter('educationLevel', level.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{level.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notice Period Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Notice Period</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'immediate', label: 'Immediate (0-7 days)' },
                      { value: '15-days', label: '15 days' },
                      { value: '30-days', label: '30 days' },
                      { value: '60-days', label: '60 days' },
                      { value: '90-days', label: '90 days' },
                      { value: 'flexible', label: 'Flexible' }
                    ].map(period => (
                      <label key={period.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.noticePeriod.includes(period.value)}
                          onChange={() => toggleFilter('noticePeriod', period.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{period.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Posted Date Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Posted Date</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'today', label: 'Today' },
                      { value: 'week', label: 'Past Week' },
                      { value: 'month', label: 'Past Month' },
                      { value: 'all', label: 'All Time' }
                    ].map(date => (
                      <label key={date.value} className="flex items-center">
                        <input
                          type="radio"
                          name="postedDate"
                          checked={filters.postedDate === date.value}
                          onChange={() => setFilters(prev => ({ ...prev, postedDate: date.value }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{date.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Save Filters Button */}
                <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                  <BookmarkIcon className="h-4 w-4" />
                  Save Filters
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Job Opportunities</h1>
                  <p className="text-gray-600 mt-1">{filteredJobs.length} jobs found</p>
                </div>
                <button
                  onClick={() => setMyApplicationsCount(prev => prev)}
                  className="mt-4 sm:mt-0 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Briefcase className="h-4 w-4" />
                  My Applications ({myApplicationsCount})
                </button>
              </div>

              {/* Search and Filter Toggle */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by title, skill, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>
              </div>

              {/* Job Cards */}
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                            {job.company.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                              {job.title}
                            </h3>
                            <p className="text-gray-600">{job.company.name}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {getLocationText(job)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {getExperienceText(job)}
                          </div>
                          {job.posted_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {getPostedTime(job.posted_at)}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {job.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 3 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm">
                              +{job.skills.length - 3} more
                            </span>
                          )}
                        </div>

                        {getSalaryText(job) && (
                          <div className="flex items-center gap-1 text-green-600 font-medium">
                            <DollarSign className="h-4 w-4" />
                            {getSalaryText(job)}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {getMatchPercentage(job)}% Match
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSaveJob(job.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              savedJobs.has(job.id)
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <BookmarkIcon className="h-4 w-4" />
                          </button>
                          <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-sm text-gray-600 line-clamp-2 flex-1 mr-4">
                        {job.description.substring(0, 150)}...
                      </p>
                      <button
                        onClick={() => handleApplyToJob(job.id)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredJobs.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or filters to find more opportunities.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Jobs;