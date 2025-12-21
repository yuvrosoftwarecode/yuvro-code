import { useState, useEffect } from 'react';
import { Search, Filter, Users, MapPin, DollarSign, Clock, GraduationCap, Building, Briefcase, RotateCcw, Sparkles, Eye, Mail, Download } from 'lucide-react';
import RoleSidebar from '../../components/common/RoleSidebar';
import RoleHeader from '../../components/common/RoleHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import candidateService, { 
  CandidateSearchFilters, 
  Candidate, 
  CandidateSearchResult, 
  FilterOptions 
} from '@/services/candidateService';

interface CandidateFilters {
  skills: string;
  experienceFrom: number;
  experienceTo: number;
  location: string;
  ctcFrom: number;
  ctcTo: number;
  noticePeriod: string[];
  education: string;
  domain: string;
  employmentType: string[];
  companyType: string;
  activeInDays: string;
}

const Candidates = () => {
  const [filters, setFilters] = useState<CandidateFilters>({
    skills: '',
    experienceFrom: 0,
    experienceTo: 20,
    location: '',
    ctcFrom: 0,
    ctcTo: 100,
    noticePeriod: [],
    education: '',
    domain: '',
    employmentType: [],
    companyType: 'any',
    activeInDays: ''
  });

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CandidateSearchResult | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load filter options on component mount
  useEffect(() => {
    loadFilterOptions();
    // Test basic connectivity on mount
    testBasicConnectivity();
  }, []);

  const testBasicConnectivity = async () => {
    try {
      console.log('Testing basic API connectivity...');
      
      // First test if we can reach the API at all
      const apiBaseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL;
      console.log('API Base URL:', apiBaseUrl);
      
      if (!apiBaseUrl) {
        throw new Error('VITE_BACKEND_API_BASE_URL is not configured');
      }
      
      // Test the candidate search endpoint
      const testResult = await candidateService.searchCandidates({ page: 1, page_size: 1 });
      console.log('Basic connectivity test successful:', testResult);
      setError(null);
    } catch (error: any) {
      console.error('Basic connectivity test failed:', error);
      
      let errorMsg = 'Unknown error';
      if (error?.message?.includes('VITE_BACKEND_API_BASE_URL')) {
        errorMsg = 'API URL not configured. Check environment variables.';
      } else if (error?.message?.includes('NetworkError') || error?.message?.includes('fetch')) {
        errorMsg = 'Cannot connect to backend server. Is it running?';
      } else if (error?.response?.status === 403) {
        errorMsg = 'Permission denied. Please login with a recruiter account.';
      } else if (error?.response?.status === 404) {
        errorMsg = 'API endpoint not found. Check backend configuration.';
      } else if (error?.response?.status >= 500) {
        errorMsg = 'Backend server error. Check server logs.';
      } else {
        errorMsg = error?.message || error?.response?.data?.error || 'Connection failed';
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      console.log('Loading filter options...');
      const options = await candidateService.getFilterOptions();
      console.log('Filter options loaded:', options);
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to load filter options:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
      toast.error('Failed to load filter options. Check console for details.');
    }
  };

  const handleSearch = async (page = 1) => {
    setIsSearching(true);
    try {
      const searchFilters: CandidateSearchFilters = {
        skills: filters.skills || undefined,
        experience_from: filters.experienceFrom || undefined,
        experience_to: filters.experienceTo || undefined,
        location: filters.location || undefined,
        ctc_from: filters.ctcFrom || undefined,
        ctc_to: filters.ctcTo || undefined,
        notice_period: filters.noticePeriod.length > 0 ? filters.noticePeriod : undefined,
        education: filters.education || undefined,
        domain: filters.domain || undefined,
        employment_type: filters.employmentType.length > 0 ? filters.employmentType : undefined,
        company_type: filters.companyType && filters.companyType !== 'any' ? filters.companyType : undefined,
        active_in_days: filters.activeInDays ? parseInt(filters.activeInDays) : undefined,
        page,
        page_size: 20
      };

      console.log('Sending search request with filters:', searchFilters);
      
      const results = await candidateService.searchCandidates(searchFilters);
      console.log('Search results received:', results);
      
      setSearchResults(results);
      setCurrentPage(page);
      
      if (results.total_count === 0) {
        toast.info('No candidates found matching your criteria. Try adjusting your filters.');
      } else {
        toast.success(`Found ${results.total_count} candidates`);
      }
    } catch (error: any) {
      console.error('Search failed:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      
      let errorMessage = 'Search failed. Please try again.';
      
      if (error?.response?.status === 403) {
        errorMessage = 'Permission denied. Please ensure you have recruiter access.';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setFilters({
      skills: '',
      experienceFrom: 0,
      experienceTo: 20,
      location: '',
      ctcFrom: 0,
      ctcTo: 100,
      noticePeriod: [],
      education: '',
      domain: '',
      employmentType: [],
      companyType: 'any',
      activeInDays: ''
    });
  };

  const toggleArrayFilter = (key: keyof Pick<CandidateFilters, 'noticePeriod' | 'employmentType'>, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const headerActions = (
    <>
      <Button
        onClick={() => handleReset()}
        variant="outline"
        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <RotateCcw className="h-4 w-4" />
        <span>Reset Filters</span>
      </Button>
      <Button
        onClick={() => handleSearch()}
        disabled={isSearching}
        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
      >
        {isSearching ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Searching...</span>
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            <span>Search Candidates</span>
          </>
        )}
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <RoleSidebar />

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <RoleHeader
            title="Candidate Search Dashboard"
            subtitle="Find and connect with the best candidates for your positions"
            actions={headerActions}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Status Display */}
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800">Initializing candidate search system...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">⚠️</div>
                <div>
                  <div className="font-medium text-red-800">System Error</div>
                  <div className="text-red-700 text-sm">{error}</div>
                  <button 
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      testBasicConnectivity();
                    }}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-green-600 mr-3">✅</div>
                <span className="text-green-800">Candidate search system is ready</span>
              </div>
            </div>
          )}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSearch();
            }}
            className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
          >
            {/* Search Filters */}
            <div className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Search Filters</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-purple-200"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {/* Skills & Keywords */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    <Label className="text-sm font-semibold text-gray-700">Skills & Keywords</Label>
                  </div>
                  <Input
                    placeholder="Enter a skill (e.g., Java, React, Python)"
                    value={filters.skills}
                    onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* Experience Range */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-purple-500" />
                    <Label className="text-sm font-semibold text-gray-700">Experience (Years)</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">From:</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={filters.experienceFrom}
                        onChange={(e) => setFilters(prev => ({ ...prev, experienceFrom: parseInt(e.target.value) || 0 }))}
                        className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">To:</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={filters.experienceTo}
                        onChange={(e) => setFilters(prev => ({ ...prev, experienceTo: parseInt(e.target.value) || 20 }))}
                        className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-pink-500" />
                    <Label className="text-sm font-semibold text-gray-700">Location</Label>
                  </div>
                  <Input
                    placeholder="Enter location"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    className="border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                  />
                </div>

                {/* CTC Range */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <Label className="text-sm font-semibold text-gray-700">CTC Range (LPA)</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">From:</Label>
                      <Input
                        type="number"
                        min="0"
                        value={filters.ctcFrom}
                        onChange={(e) => setFilters(prev => ({ ...prev, ctcFrom: parseInt(e.target.value) || 0 }))}
                        className="border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">To:</Label>
                      <Input
                        type="number"
                        min="0"
                        value={filters.ctcTo}
                        onChange={(e) => setFilters(prev => ({ ...prev, ctcTo: parseInt(e.target.value) || 100 }))}
                        className="border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Notice Period */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <Label className="text-sm font-semibold text-gray-700">Notice Period</Label>
                  </div>
                  <div className="space-y-2">
                    {filterOptions?.notice_periods.map((period) => (
                      <div key={period.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={period.value}
                          checked={filters.noticePeriod.includes(period.value)}
                          onCheckedChange={() => toggleArrayFilter('noticePeriod', period.value)}
                          className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <Label htmlFor={period.value} className="text-sm text-gray-600 cursor-pointer">
                          {period.label}
                        </Label>
                      </div>
                    )) || (
                      // Fallback with correct backend values
                      [
                        { value: 'immediate', label: 'Immediate' },
                        { value: '15_days', label: '15 Days' },
                        { value: '30_days', label: '30 Days' },
                        { value: '60_days', label: '60 Days' },
                        { value: '90_days', label: '90 Days' }
                      ].map((period) => (
                        <div key={period.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={period.value}
                            checked={filters.noticePeriod.includes(period.value)}
                            onCheckedChange={() => toggleArrayFilter('noticePeriod', period.value)}
                            className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                          />
                          <Label htmlFor={period.value} className="text-sm text-gray-600 cursor-pointer">
                            {period.label}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Education */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    <Label className="text-sm font-semibold text-gray-700">Education</Label>
                  </div>
                  <Select value={filters.education} onValueChange={(value) => setFilters(prev => ({ ...prev, education: value }))}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions?.education_levels.map((edu) => (
                        <SelectItem key={edu.value} value={edu.value}>{edu.label}</SelectItem>
                      )) || (
                        <>
                          <SelectItem value="high_school">High School</SelectItem>
                          <SelectItem value="diploma">Diploma</SelectItem>
                          <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                          <SelectItem value="master">Master's Degree</SelectItem>
                          <SelectItem value="phd">PhD</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Domain */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-teal-500" />
                    <Label className="text-sm font-semibold text-gray-700">Domain</Label>
                  </div>
                  <Select value={filters.domain} onValueChange={(value) => setFilters(prev => ({ ...prev, domain: value }))}>
                    <SelectTrigger className="border-gray-200 focus:border-teal-500 focus:ring-teal-500">
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Employment Type */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-violet-500" />
                    <Label className="text-sm font-semibold text-gray-700">Employment Type</Label>
                  </div>
                  <div className="space-y-2">
                    {[
                      { value: 'full_time', label: 'Full-Time' },
                      { value: 'part_time', label: 'Part-Time' },
                      { value: 'contract', label: 'Contract' },
                      { value: 'internship', label: 'Internship' },
                      { value: 'remote', label: 'Remote' }
                    ].map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.value}
                          checked={filters.employmentType.includes(type.value)}
                          onCheckedChange={() => toggleArrayFilter('employmentType', type.value)}
                          className="border-violet-300 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                        />
                        <Label htmlFor={type.value} className="text-sm text-gray-600 cursor-pointer">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Company Type */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-rose-500" />
                    <Label className="text-sm font-semibold text-gray-700">Company Type</Label>
                  </div>
                  <Select value={filters.companyType} onValueChange={(value) => setFilters(prev => ({ ...prev, companyType: value }))}>
                    <SelectTrigger className="border-gray-200 focus:border-rose-500 focus:ring-rose-500">
                      <SelectValue placeholder="Select company type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="mid_size">Mid-size Company</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="non_profit">Non-profit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Active in Last */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <Label className="text-sm font-semibold text-gray-700">Active in Last (Days)</Label>
                  </div>
                  <Select value={filters.activeInDays} onValueChange={(value) => setFilters(prev => ({ ...prev, activeInDays: value }))}>
                    <SelectTrigger className="border-gray-200 focus:border-amber-500 focus:ring-amber-500">
                      <SelectValue placeholder="Select activity period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="180">Last 6 months</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Debug Buttons (for development) */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-4">
                  {/* Test Button for debugging */}
                  <Button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        console.log('Testing basic search...');
                        const testFilters = { page: 1, page_size: 10 };
                        const results = await candidateService.searchCandidates(testFilters);
                        console.log('Test results:', results);
                        toast.success(`Test successful: ${results.total_count} candidates found`);
                        setSearchResults(results);
                      } catch (error) {
                        console.error('Test failed:', error);
                        toast.error('Test failed - check console for details');
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Test Basic Search
                  </Button>
                  
                  {/* Search All Button */}
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Searching all candidates...');
                      handleReset(); // Reset filters first
                      setTimeout(() => handleSearch(), 100); // Then search
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Search All
                  </Button>
                  
                  {/* Debug Panel */}
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('=== DEBUG INFO ===');
                      console.log('Current filters:', filters);
                      console.log('Filter options:', filterOptions);
                      console.log('Search results:', searchResults);
                      console.log('Is searching:', isSearching);
                      console.log('Is loading:', isLoading);
                      console.log('Error:', error);
                      console.log('API Base URL:', import.meta.env.VITE_BACKEND_API_BASE_URL);
                      toast.info('Debug info logged to console');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Debug Info
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {/* Results Section */}
          {searchResults && (
            <div className="mt-8 space-y-6">
              {/* Results Header */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Search Results</h3>
                    <p className="text-gray-600">
                      Found {searchResults.total_count} candidates • Page {searchResults.page} of {searchResults.total_pages}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSearch(currentPage - 1);
                      }}
                      disabled={!searchResults.has_previous || isSearching}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSearch(currentPage + 1);
                      }}
                      disabled={!searchResults.has_next || isSearching}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>

              {/* Candidate Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {searchResults.candidates.map((candidate) => (
                  <CandidateCard key={candidate.id} candidate={candidate} />
                ))}
              </div>

              {/* Pagination */}
              {searchResults.total_pages > 1 && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: Math.min(5, searchResults.total_pages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSearch(pageNum);
                          }}
                          disabled={isSearching}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isSearching && !searchResults && (
            <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-12">
              <div className="text-center">
                <div className="animate-pulse">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Candidate Card Component
const CandidateCard = ({ candidate }: { candidate: Candidate }) => {
  const getExperienceText = (years: number, months: number) => {
    if (years === 0 && months === 0) return 'Fresher';
    if (years === 0) return `${months} months`;
    if (months === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years}.${Math.round(months / 12 * 10)} years`;
  };

  const getNoticePeriodText = (period: string) => {
    const periodMap: Record<string, string> = {
      'immediate': 'Immediate',
      '15_days': '15 Days',
      '30_days': '30 Days',
      '60_days': '60 Days',
      '90_days': '90 Days'
    };
    return periodMap[period] || period;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
            {candidate.full_name ? candidate.full_name.charAt(0) : candidate.email.charAt(0)}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-900">
              {candidate.full_name || `${candidate.first_name} ${candidate.last_name}`.trim() || candidate.username}
            </CardTitle>
            <p className="text-gray-600 font-medium">{candidate.title || 'Software Developer'}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {candidate.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {candidate.location}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {getExperienceText(candidate.total_experience_years, candidate.total_experience_months)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Skills */}
        {candidate.skills_list.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
            <div className="flex flex-wrap gap-1">
              {candidate.skills_list.slice(0, 6).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {candidate.skills_list.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{candidate.skills_list.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Experience & Salary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {candidate.expected_ctc && (
            <div>
              <p className="text-gray-500">Expected CTC</p>
              <p className="font-medium text-green-600">
                {candidate.currency} {candidate.expected_ctc} LPA
              </p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Notice Period</p>
            <p className="font-medium">{getNoticePeriodText(candidate.notice_period)}</p>
          </div>
        </div>

        {/* About */}
        {candidate.about && (
          <div>
            <p className="text-sm text-gray-600 line-clamp-2">{candidate.about}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button 
            type="button"
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Implement view profile functionality
              console.log('View profile for candidate:', candidate.id);
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            View Profile
          </Button>
          <Button 
            type="button"
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Implement contact functionality
              console.log('Contact candidate:', candidate.id);
            }}
          >
            <Mail className="h-3 w-3 mr-1" />
            Contact
          </Button>
          {candidate.resume_file && (
            <Button 
              type="button"
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (candidate.resume_file) {
                  window.open(candidate.resume_file, '_blank');
                }
              }}
            >
              <Download className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Candidates;