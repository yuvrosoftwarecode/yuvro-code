



import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Users, Calendar, Clock, Building2, GraduationCap, Pencil, Trash2, Eye, FileText, Code, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import RoleSidebar from '@/components/common/RoleSidebar';
import RoleHeader from '@/components/common/RoleHeader';
import SearchBar from '@/components/common/SearchBar';
import { useAuth } from "@/contexts/AuthContext";
import { mockInterviewService, MockInterview, CreateMockInterviewData } from '@/services/mockInterviewService';

interface Contest {
  id: string;
  title: string;
  organizer: string;
  type: 'company' | 'college' | 'weekly' | 'monthly';
  // Normalize to backend values: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  duration: string;
  participants: number;
  prize?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  Interviewee_config?: {
    mcq_single: string[];
    mcq_multiple: string[];
    coding: string[];
    descriptive: string[];
  };
  Interviewee_random_config?: {
    mcq_single: number;
    mcq_multiple: number;
    coding: number;
    descriptive: number;
  };
}

function mapContestFromBackend(c: any): Contest {
  const rawStatus = String(c.status || 'scheduled').toLowerCase().trim();
  let status = rawStatus;
  // normalize legacy or different terms
  if (status === 'past') status = 'completed';
  if (status === 'upcoming') status = 'scheduled';

  // Client-side fallback: derive ongoing status if times indicate interview is in-progress
  try {
    const start = c.scheduled_datetime ? new Date(c.scheduled_datetime) : (c.start_datetime ? new Date(c.start_datetime) : null);
    const durationMinutes = Number(c.duration) || 0;
    if (start && durationMinutes > 0) {
      const now = new Date();
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      if (now >= start && now <= end) {
        // if backend didn't mark it as ongoing, prefer showing it as ongoing in UI
        if (status !== 'ongoing') {
          console.debug(`Marking interview ${c.id} as ongoing (client-side) based on scheduled_datetime and duration)`);
          status = 'ongoing';
        }
      }
    }
  } catch (e) {
    // ignore parsing errors
  }

  return {
    id: String(c.id),
    title: c.title,
    organizer: c.organizer,
    type: c.type,
    status,
    startDate: c.scheduled_datetime || c.start_datetime || c.start_date || '',
    endDate: c.end_datetime || c.end_date || '',
    duration: c.duration ? `${Math.round((typeof c.duration === 'string' ? parseFloat(c.duration) : c.duration) / 60)} min` : '',
    participants: c.participants_count ?? 0,
    prize: c.prize ?? '',
    difficulty: c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1),
    description: c.description ?? '',
    Interviewee_config: c.Interviewee_config ?? {
      mcq_single: [],
      mcq_multiple: [],
      coding: [],
      descriptive: []
    },
    Interviewee_random_config: c.Interviewee_random_config ?? {
      mcq_single: 0,
      mcq_multiple: 0,
      coding: 0,
      descriptive: 0
    },
  };
}

export default function OwnerContest() {
  const [mockInterviews, setMockInterviews] = useState<Contest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [currentView, setCurrentView] = useState<'list' | 'view'>('list');
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [contestInterviewee, setContestInterviewee] = useState<{
    mcq_single: Question[];
    mcq_multiple: Question[];
    coding: Question[];
    descriptive: Question[];
  }>({
    mcq_single: [],
    mcq_multiple: [],
    coding: [],
    descriptive: []
  });
  const [loadingInterviewee, setLoadingInterviewee] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();



  const fetchMockInterviews = async () => {
    try {
      const data = await mockInterviewService.getAllMockInterviews();
      if (Array.isArray(data)) {
        const mapped = data.map(mapContestFromBackend);
        // Debug: log status distribution to help diagnose ongoing/count issues
        const counts = mapped.reduce((acc: Record<string, number>, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.debug('Fetched mock interviews status counts:', counts);
        setMockInterviews(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch mock interviews:', err);
      toast.error('Failed to fetch mock interviews');
    }
  };

  const location = useLocation();

  useEffect(() => {
    fetchMockInterviews();
  }, [location.state]);



  const handleDeleteContest = async (id: string) => {
    try {
      await mockInterviewService.deleteMockInterview(id);
      toast.success('Contest deleted successfully');
      fetchMockInterviews();
    } catch (err) {
      toast.error('Failed to delete contest');
    }
  };



  const openEditForm = (contest?: Contest | null) => {
    if (!contest) {
      toast.error('No contest selected for editing');
      return;
    }

    navigate(`/instructor/mock-interview/${contest.id}/edit`);
  };

  const fetchContestInterviewee = async (IntervieweeConfig: Contest['Interviewee_config']) => {
    if (!IntervieweeConfig) return;

    setLoadingInterviewee(true);
    try {
      const fetchedInterviewee = {
        mcq_single: [] as Question[],
        mcq_multiple: [] as Question[],
        coding: [] as Question[],
        descriptive: [] as Question[]
      };

      const normalizedIntervieweeConfig = {
        mcq_single: [],
        mcq_multiple: [],
        coding: [],
        descriptive: [],
        ...IntervieweeConfig
      };

      for (const [type, ids] of Object.entries(normalizedIntervieweeConfig)) {
        let questionIdArray: string[] = [];

        if (Array.isArray(ids)) {
          questionIdArray = ids;
        } else if (typeof ids === 'string') {
          questionIdArray = [ids];
        } else if (ids && typeof ids === 'object') {
          questionIdArray = Object.values(ids).flat().filter(id => typeof id === 'string');
        }

        if (questionIdArray.length > 0) {
          try {
            const Interviewee = await Promise.all(
              questionIdArray.map(id => fetchQuestionById(String(id)))
            );
            fetchedInterviewee[type as keyof typeof fetchedInterviewee] = Interviewee;
          } catch (questionError) {
            console.error(`Failed to fetch Interviewee for type ${type}:`, questionError);
          }
        }
      }

      setContestInterviewee(fetchedInterviewee);
    } catch (error) {
      console.error('Failed to fetch contest Interviewee:', error);
      toast.error('Failed to load contest Interviewee');
    } finally {
      setLoadingInterviewee(false);
    }
  };

  const openViewForm = (contest: Contest) => {
    setSelectedContest(contest);
    setCurrentView('view');
    if (contest.Interviewee_config) {
      fetchContestInterviewee(contest.Interviewee_config);
    }
  };

  const filteredMockInterviews = mockInterviews.filter(contest => {
    const q = (searchQuery || '').toString().trim().toLowerCase();
    const matchesSearch = !q || [
      contest.title,
      contest.organizer,
      contest.type,
      contest.difficulty,
      contest.status,
      contest.startDate
    ].some(field => (field || '').toString().toLowerCase().includes(q));
    // Normalize status compare and add a robust fallback for ongoing-like values
    const normalizedStatus = (contest.status || '').toString().toLowerCase().trim();
    const matchesTab = selectedTab === 'all' || normalizedStatus === selectedTab || (
      selectedTab === 'ongoing' && (
        normalizedStatus.includes('ongo') || normalizedStatus.includes('in_progress') || normalizedStatus.includes('running')
      )
    );
    return matchesSearch && matchesTab;
  });

  // Debug: log when the selected tab changes and what the filtered result is
  useEffect(() => {
    try {
      console.debug('MockInterview: selectedTab=', selectedTab, 'filteredCount=', filteredMockInterviews.length, 'statusCounts=', mockInterviews.reduce((acc: Record<string, number>, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<string, number>));
    } catch (e) {
      // ignore
    }
  }, [selectedTab, searchQuery, mockInterviews]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'company': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'college': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'weekly': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'monthly': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-700 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getHeaderTitle = () => {
    switch (currentView) {
      case 'view': return `Contest Details: ${selectedContest?.title}`;
      default: return 'Mock Interview Management';
    }
  };

  const getHeaderSubtitle = () => {
    switch (currentView) {
      case 'view': return 'View contest information and details';
      default: return 'Schedule and manage mock interviews for students';
    }
  };

  const headerActions = currentView === 'list' ? (
    <button
      onClick={() => navigate('/instructor/mock-interview/add')}
      className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
    >
      + Add Mock Interview
    </button>
  ) : (
    <button
      onClick={() => {
        setCurrentView('list');
        setSelectedContest(null);
      }}
      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
    >
      ← Back to List
    </button>
  );
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <RoleSidebar />
        <div className="flex-1">
          <RoleHeader
            title={getHeaderTitle()}
            subtitle={getHeaderSubtitle()}
            actions={headerActions}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {currentView === 'list' && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-md font-medium text-gray-600">Total Interviews</CardTitle>
                    </CardHeader>
                     <CardContent>
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold">{mockInterviews.length}</div>
        <Trophy className="h-8 w-8 text-blue-500" />
      </div>
    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-md font-medium text-gray-600">Scheduled</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold">{mockInterviews.filter(c => c.status === 'scheduled').length}</div>
                        <Calendar className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-md font-medium text-gray-600">Ongoing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-green-600">{mockInterviews.filter(c => c.status === 'ongoing').length}</div>
                        <Clock className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-md font-medium text-gray-600">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold">{mockInterviews.filter(c => c.status === 'completed').length}</div>
                        <Users className="h-8 w-8 text-gray-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex w-full items-center gap-4 h-12">
                    <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex items-center border border-gray-200 rounded-lg">
                      <TabsList className="flex rounded-lg overflow-hidden border border-gray-200 bg-white px-4 gap-4 h-full items-center">
                        <TabsTrigger
                          className={`px-5 h-8 text-sm font-medium rounded-lg transition-colors duration-150 ${selectedTab === 'all' ? 'bg-gray-200 text-gray-900 shadow-sm' : 'bg-white text-gray-600'}`}
                          value="all"
                        >
                          All Interviews
                        </TabsTrigger>
                        <TabsTrigger
                          className={`px-5 h-8 text-sm font-medium rounded-lg transition-colors duration-150 ${selectedTab === 'scheduled' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'bg-white text-gray-600'}`}
                          value="scheduled"
                        >
                          Scheduled
                        </TabsTrigger>
                        <TabsTrigger
                          className={`px-5 h-8 text-sm font-medium rounded-lg transition-colors duration-150 ${selectedTab === 'ongoing' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'bg-white text-gray-600'}`}
                          value="ongoing"
                        >
                          Ongoing
                        </TabsTrigger>
                        <TabsTrigger
                          className={`px-5 h-8 text-sm font-medium rounded-lg transition-colors duration-150 ${selectedTab === 'completed' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'bg-white text-gray-600'}`}
                          value="completed"
                        >
                          Completed
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="group relative h-full flex items-center">
                      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                    </div>
                  </div>
                </div>
              </>
            )}



            {currentView === 'view' && selectedContest && (
              <div className="bg-white shadow rounded-lg mb-6 p-6">
                <div className="space-y-6">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-blue-500" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contest Title</label>
                          <div className="text-gray-900 font-medium">{selectedContest.title}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Organizer</label>
                          <div className="text-gray-900">{selectedContest.organizer}</div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <div className="text-gray-900">{selectedContest.description || 'No description provided'}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contest Type</label>
                          <Badge className={getTypeColor(selectedContest.type)} variant="outline">
                            <span className="mr-1">{selectedContest.type === 'company' ? <Building2 className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}</span>
                            {selectedContest.type}
                          </Badge>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                          <Badge className={getDifficultyColor(selectedContest.difficulty)} variant="outline">
                            {selectedContest.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-green-500" />
                        Schedule & Duration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <div className="text-gray-900">
                            {selectedContest.startDate
                              ? new Date(selectedContest.startDate).toLocaleDateString()
                              : 'Not set'
                            }
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <div className="text-gray-900">
                            {selectedContest.endDate
                              ? new Date(selectedContest.endDate).toLocaleDateString()
                              : 'Not set'
                            }
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                          <div className="text-gray-900">{selectedContest.duration}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <Badge className={getStatusColor(selectedContest.status)} variant="outline">
                            {selectedContest.status}
                          </Badge>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
                          <div className="text-gray-900">{selectedContest.participants}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                        Prize Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prize</label>
                        <div className="text-gray-900">{selectedContest.prize || 'No prize specified'}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-purple-500" />
                        Interviewee Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {selectedContest.Interviewee_random_config && Object.values(selectedContest.Interviewee_random_config).some(count => count > 0) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Random Interviewee</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {selectedContest.Interviewee_random_config.mcq_single > 0 && (
                              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                <div className="text-sm font-medium text-purple-700">MCQ Single</div>
                                <div className="text-lg font-bold text-purple-900">{selectedContest.Interviewee_random_config.mcq_single}</div>
                              </div>
                            )}
                            {selectedContest.Interviewee_random_config.mcq_multiple > 0 && (
                              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                <div className="text-sm font-medium text-purple-700">MCQ Multiple</div>
                                <div className="text-lg font-bold text-purple-900">{selectedContest.Interviewee_random_config.mcq_multiple}</div>
                              </div>
                            )}
                            {selectedContest.Interviewee_random_config.coding > 0 && (
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <div className="text-sm font-medium text-blue-700">Coding</div>
                                <div className="text-lg font-bold text-blue-900">{selectedContest.Interviewee_random_config.coding}</div>
                              </div>
                            )}
                            {selectedContest.Interviewee_random_config.descriptive > 0 && (
                              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                <div className="text-sm font-medium text-orange-700">Descriptive</div>
                                <div className="text-lg font-bold text-orange-900">{selectedContest.Interviewee_random_config.descriptive}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedContest.Interviewee_config && Object.values(selectedContest.Interviewee_config).flat().length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Specific Interviewee ({Object.values(selectedContest.Interviewee_config).flat().length})
                          </label>

                          {loadingInterviewee ? (
                            <div className="flex justify-center items-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              <span className="ml-2 text-gray-600">Loading Interviewee...</span>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {contestInterviewee.mcq_single.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-purple-700 mb-3 flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    MCQ Single Choice ({contestInterviewee.mcq_single.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {contestInterviewee.mcq_single.map((question, index) => (
                                      <div key={question.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-purple-700">Q{index + 1}.</span>
                                            <Badge className="bg-purple-100 text-purple-700 border-purple-200" variant="outline">
                                              {question.difficulty}
                                            </Badge>
                                            <span className="text-xs text-purple-600">{question.marks} marks</span>
                                          </div>
                                        </div>
                                        <h5 className="text-sm font-medium text-gray-900 mb-2">{question.title}</h5>
                                        <div className="text-sm text-gray-700 line-clamp-3">
                                          {question.content.replace(/<[^>]*>/g, '')}
                                        </div>
                                        {question.categories.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {question.categories.slice(0, 3).map((category, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-xs">
                                                {category}
                                              </Badge>
                                            ))}
                                            {question.categories.length > 3 && (
                                              <Badge variant="secondary" className="text-xs">
                                                +{question.categories.length - 3}
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {contestInterviewee.mcq_multiple.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-purple-700 mb-3 flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    MCQ Multiple Choice ({contestInterviewee.mcq_multiple.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {contestInterviewee.mcq_multiple.map((question, index) => (
                                      <div key={question.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-purple-700">Q{index + 1}.</span>
                                            <Badge className="bg-purple-100 text-purple-700 border-purple-200" variant="outline">
                                              {question.difficulty}
                                            </Badge>
                                            <span className="text-xs text-purple-600">{question.marks} marks</span>
                                          </div>
                                        </div>
                                        <h5 className="text-sm font-medium text-gray-900 mb-2">{question.title}</h5>
                                        <div className="text-sm text-gray-700 line-clamp-3">
                                          {question.content.replace(/<[^>]*>/g, '')}
                                        </div>
                                        {question.categories.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {question.categories.slice(0, 3).map((category, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-xs">
                                                {category}
                                              </Badge>
                                            ))}
                                            {question.categories.length > 3 && (
                                              <Badge variant="secondary" className="text-xs">
                                                +{question.categories.length - 3}
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {contestInterviewee.coding.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                                    <Code className="h-4 w-4 mr-1" />
                                    Coding Interviewee ({contestInterviewee.coding.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {contestInterviewee.coding.map((question, index) => (
                                      <div key={question.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-blue-700">Q{index + 1}.</span>
                                            <Badge className="bg-blue-100 text-blue-700 border-blue-200" variant="outline">
                                              {question.difficulty}
                                            </Badge>
                                            <span className="text-xs text-blue-600">{question.marks} marks</span>
                                          </div>
                                        </div>
                                        <h5 className="text-sm font-medium text-gray-900 mb-2">{question.title}</h5>
                                        <div className="text-sm text-gray-700 line-clamp-3">
                                          {question.content.replace(/<[^>]*>/g, '')}
                                        </div>
                                        {question.categories.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {question.categories.slice(0, 3).map((category, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-xs">
                                                {category}
                                              </Badge>
                                            ))}
                                            {question.categories.length > 3 && (
                                              <Badge variant="secondary" className="text-xs">
                                                +{question.categories.length - 3}
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {contestInterviewee.descriptive.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-orange-700 mb-3 flex items-center">
                                    <FileText className="h-4 w-4 mr-1" />
                                    Descriptive Interviewee ({contestInterviewee.descriptive.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {contestInterviewee.descriptive.map((question, index) => (
                                      <div key={question.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-orange-700">Q{index + 1}.</span>
                                            <Badge className="bg-orange-100 text-orange-700 border-orange-200" variant="outline">
                                              {question.difficulty}
                                            </Badge>
                                            <span className="text-xs text-orange-600">{question.marks} marks</span>
                                          </div>
                                        </div>
                                        <h5 className="text-sm font-medium text-gray-900 mb-2">{question.title}</h5>
                                        <div className="text-sm text-gray-700 line-clamp-3">
                                          {question.content.replace(/<[^>]*>/g, '')}
                                        </div>
                                        {question.categories.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {question.categories.slice(0, 3).map((category, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-xs">
                                                {category}
                                              </Badge>
                                            ))}
                                            {question.categories.length > 3 && (
                                              <Badge variant="secondary" className="text-xs">
                                                +{question.categories.length - 3}
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {(!selectedContest.Interviewee_config || Object.values(selectedContest.Interviewee_config).flat().length === 0) &&
                        (!selectedContest.Interviewee_random_config || Object.values(selectedContest.Interviewee_random_config).every(count => count === 0)) && (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm">No Interviewee configured for this contest</p>
                          </div>
                        )}
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => openEditForm(selectedContest)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Edit Contest
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'list' && (
              <>
                <Card className="border border-gray-200 rounded-lg">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-2xl font-semibold">MockInterviews</CardTitle>
                    <CardDescription className="text-gray-600">
                      {filteredMockInterviews.length} Interviews(s) found
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 px-0 pb-0 p-5">
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                      <Table className="border border-gray-200 rounded-lg">
                        <TableHeader>
                          <TableRow className="border border-gray-200">
                            <TableHead>Interviews</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Difficulty</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Interviewee</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMockInterviews.map((contest) => {
                            const specificInterviewee = Object.values(contest.Interviewee_config || {}).flat().length;
                            const randomInterviewee = Object.values(contest.Interviewee_random_config || {}).reduce((sum, count) => sum + count, 0);
                            const totalInterviewee = specificInterviewee + randomInterviewee;

                            return (
                              <TableRow className="border border-gray-200" key={contest.id}>
                                <TableCell className="font-medium">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{contest.title}</div>
                                    <div className="text-sm text-gray-500">{contest.organizer}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getTypeColor(contest.type)} variant="outline">
                                    <span className="mr-1">{contest.type === 'company' ? <Building2 className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}</span>
                                    {contest.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getDifficultyColor(contest.difficulty)} variant="outline">
                                    {contest.difficulty}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(contest.status)} variant="outline">
                                    {contest.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">{totalInterviewee} total</div>
                                    {specificInterviewee > 0 && (
                                      <div className="text-xs text-gray-500">{specificInterviewee} specific</div>
                                    )}
                                    {randomInterviewee > 0 && (
                                      <div className="text-xs text-gray-500">{randomInterviewee} random</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{new Date(contest.startDate).toLocaleDateString()}</TableCell>
                                <TableCell>{contest.duration}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => openViewForm(contest)}
                                      className="p-1 text-gray-400 hover:text-blue-600"
                                      title="View Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => openEditForm(contest)}
                                      className="p-1 text-gray-400 hover:text-green-600"
                                      title="Edit Contest"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteContest(contest.id)}
                                      className="p-1 text-gray-400 hover:text-red-600"
                                      title="Delete Contest"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {filteredMockInterviews.length === 0 && (
                  <div className="bg-white shadow rounded-lg">
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No MockInterviews found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchQuery ? `No MockInterviews found matching "${searchQuery}"` : `No ${selectedTab} MockInterviews found.`}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-4 text-blue-600 hover:text-blue-500 text-sm font-medium"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}