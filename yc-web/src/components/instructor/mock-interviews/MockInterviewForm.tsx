import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar, Settings, FileText } from 'lucide-react';
import QuestionBank from '@/components/common/QuestionBank';
import { toast } from 'sonner';
import RoleSidebar from '@/components/common/RoleSidebar';
import RoleHeader from '@/components/common/RoleHeader';
import { mockInterviewService } from '@/services/mockInterviewService';

interface Contest {
  id: string;
  title: string;
  organizer: string;
  type: 'company' | 'college' | 'weekly' | 'monthly';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  duration: string;
  participants: number;
  prize?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
}



export default function InterviewsForm() {
  const navigate = useNavigate();
  const { mockInterviewId } = useParams<{ mockInterviewId: string }>();
  const isEditMode = !!mockInterviewId;

  const [contest, setContest] = useState<Contest | null>(null);
  const [currentFormTab, setCurrentFormTab] = useState('details');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    organizer: '',
    description: '',
    type: 'coding' as 'coding' | 'system_design' | 'aptitude' | 'behavioral' | 'domain_specific',
    startDate: '',
    endDate: '',
    duration: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    instructions: '',
    totalMarks: '100',
    passingMarks: '60',
    enableProctoring: true,
    publish_status: 'draft' as 'draft' | 'active' | 'inactive' | 'archived',
    status: 'scheduled' as 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
    prize: '',
  });

  const getHeaderTitle = () => {
    return isEditMode ? `Edit Mock Interview: ${contest?.title || 'Loading...'}` : 'Add New Mock Interview';
  };

  const getHeaderSubtitle = () => {
    return isEditMode ? 'Modify mock interview details and settings' : 'Create a new mock interview for students';
  };


  const formatDateTimeForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  useEffect(() => {
    if (!isEditMode) return;

    const fetchMockInterview = async () => {
      if (!mockInterviewId) return;

      setLoading(true);
      try {
        const data = await mockInterviewService.getMockInterview(mockInterviewId);
        setContest({
          id: String(data.id),
          title: data.title,
          organizer: data.interviewer || '',
          type: (data.type as any) || 'company',
          status: (data.status as any) || 'upcoming',
          startDate: formatDateTimeForInput(data.scheduled_datetime || ''),
          endDate: '',
          duration: String(data.duration || ''),
          participants: 0,
          prize: '',
          difficulty: data.difficulty ? data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1) : 'Medium',
          description: data.description || ''
        });

        setFormData({
          title: data.title,
          organizer: data.interviewer || '',
          type: (data.type as any) || 'coding',
          startDate: formatDateTimeForInput(data.scheduled_datetime || ''),
          endDate: '',
          duration: String(data.duration || ''),
          prize: '',
          difficulty: data.difficulty ? data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1) : 'Medium',
          description: data.description || '',
          instructions: data.instructions || '',
          totalMarks: '100',
          passingMarks: '60',
          enableProctoring: false,
          publish_status: 'draft',
          status: data.status || 'scheduled',
        });
      } catch (error) {
        console.error('Failed to fetch mock interview:', error);
        toast.error('Failed to load mock interview');
        navigate('/instructor/mock-interview');
      } finally {
        setLoading(false);
      }
    };

    fetchMockInterview();
  }, [mockInterviewId, isEditMode]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!formData.title || !formData.title.trim()) {
        toast.error('Title is required');
        setLoading(false);
        return;
      }

      if (!formData.startDate) {
        toast.error('Start date/time is required');
        setLoading(false);
        return;
      }

      if (!formData.duration || Number(formData.duration) <= 0) {
        toast.error('Duration (in minutes) must be a positive number');
        setLoading(false);
        return;
      }

      const allowedTypes = ['coding', 'system_design', 'aptitude', 'behavioral', 'domain_specific'];
      if (!allowedTypes.includes(formData.type)) {
        toast.error(`Invalid interview type: ${formData.type}. Allowed: ${allowedTypes.join(', ')}`);
        setLoading(false);
        return;
      }

      const questions: any[] = [];

      const payload: any = {
        title: formData.title,
        description: formData.description,
        type: (formData.type || 'coding'),
        difficulty: (formData.difficulty || 'medium').toLowerCase(),
        scheduled_datetime: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        duration: Number(formData.duration) || 0,
        interviewee: formData.organizer || undefined,
        questions,
        meeting_link: '',
        meeting_id: ''
      };

      console.debug('Submitting mock interview payload:', payload);

      if (isEditMode && mockInterviewId) {
        await mockInterviewService.updateMockInterview(mockInterviewId, payload);
        toast.success('Mock interview updated');
      } else {
        await mockInterviewService.createMockInterview(payload);
        toast.success('Mock interview created');
      }

      navigate('/instructor/mock-interview', { state: { refreshedAt: Date.now() } });
    } catch (error) {
        console.error('Failed to save mock interview:', error);

        const err: any = error as any;
        let serverMessage: string | null = null;

        if (err?.details) {
          if (typeof err.details === 'object' && !Array.isArray(err.details)) {
            try {
              const firstKey = Object.keys(err.details)[0];
              const val = (err.details as any)[firstKey];
              if (Array.isArray(val) && val.length > 0) {
                serverMessage = `${firstKey}: ${val[0]}`;
              } else if (typeof val === 'string') {
                serverMessage = `${firstKey}: ${val}`;
              } else {
                serverMessage = JSON.stringify(err.details);
              }
            } catch (e) {
              serverMessage = JSON.stringify(err.details);
            }
          } else {
            try {
              serverMessage = typeof err.details === 'string' ? err.details : JSON.stringify(err.details);
            } catch (e) {
              serverMessage = String(err.details);
            }
          }
        } else if (err?.message) {
          serverMessage = err.message;
        }

        if (err?.status === 0) {
          serverMessage = serverMessage ? `${serverMessage}. Is the backend running?` : 'Network error. Is the backend running?';
        }

        toast.error(
          isEditMode
            ? `Failed to update mock interview${serverMessage ? `: ${serverMessage}` : ''}`
            : `Failed to create mock interview${serverMessage ? `: ${serverMessage}` : ''}`
        );
    } finally {
      setLoading(false);
    }
  };
    
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="flex">
            <RoleSidebar />
            <div className="flex-1">
              <RoleHeader
                title="Loading..."
                subtitle="Please wait while we load the interviews details"
                actions={null}
              />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            title={
              typeof getHeaderTitle === 'function'
                ? getHeaderTitle()
                : (isEditMode ? `Edit Mock Interview: ${contest?.title || 'Loading...'}` : 'Add New Mock Interview')
            }
            subtitle={
              typeof getHeaderSubtitle === 'function'
                ? getHeaderSubtitle()
                : (isEditMode ? 'Modify mock interview details and settings' : 'Create a new mock interview for students')
            }
            actions={
              <button
                type="button"
                onClick={(e) => { console.debug('Back to list (header) clicked', e); navigate('/instructor/mock-interview'); }}
                aria-label="Back to Mock Interviews list"
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                ← Back to List
              </button>
            }
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow rounded-lg mb-6 p-6">
              <Tabs value={currentFormTab} onValueChange={setCurrentFormTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger
                    value="details"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md py-2 px-4 transition-all"
                  >
                    <Settings className="h-4 w-4" />
                    Interviews Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="questions"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md py-2 px-4 transition-all"
                  >
                    <FileText className="h-4 w-4" />
                    Questions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-blue-500" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Frontend Mock Interview"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                          />
                        </div>
                        <div>  
                          <label className="block text-sm font-medium text-gray-700 mb-2">Instructions *</label>
                          <textarea
                          value={formData.instructions}
                          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                          placeholder="Enter guidelines and format"
                          rows={3}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Briefly describe interview purpose and skills assessed"
                          rows={3}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Contest Type *</label>
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="company">Company Contest</option>
                            <option value="college">College Contest</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level *</label>
                          <select
                            value={formData.difficulty}
                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div> */}
                      </div>
                    </CardContent>
                  </Card>

            <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-indigo-500" />
                Interview Configuration
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                    </label>
                    <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                    <option value="coding">Coding</option>
                    <option value="system_design">System Design</option>
                    <option value="aptitude">Aptitude</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="domain_specific">Domain Specific</option>
                    </select>
                </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status *
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        >
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>

        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Difficulty *
        </label>
        <select
          value={formData.difficulty}
          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration (minutes) *
        </label>
        <input
          type="number"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          min="1"
          placeholder="e.g., 60"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Total Marks *
        </label>
        <input
          type="number"
          value={formData.totalMarks}
          onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
          min="1"
          placeholder="100"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Passing Marks *
        </label>
        <input
          type="number"
          value={formData.passingMarks}
          onChange={(e) => setFormData({ ...formData, passingMarks: e.target.value })}
          min="0"
          placeholder="45"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

    </div>
  </CardContent>
</Card>
            












                  {/* Schedule & Duration Card */}
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-green-500" />
                        Schedule & Duration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                          <input
                            type="datetime-local"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                          <input
                            type="datetime-local"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                          <input
                            type="number"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            placeholder="e.g., 120"
                            min="1"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  
                    <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                    Publishing
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-6">

            {/* Publish Status */}
            <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Publish Status
      </label>
      <select
        value={formData.publish_status}
        onChange={(e) =>
          setFormData({ ...formData, publish_status: e.target.value })
        }
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
      >
        <option value="inactive">Inactive</option>
        <option value="active">Active</option>
        <option value="active">Archived</option>

      </select>
    </div>

  </CardContent>
</Card>

                </TabsContent>

                <TabsContent value="questions" className="space-y-6">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-purple-500" />
                        Questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-sm text-gray-600">Questions for mock interviews are managed from the Question Bank. You can select or add questions there.</p>
                      <QuestionBank mode="selection" allowMultipleSelection={true} />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Questions tab content removed */}

                

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={(e) => { console.debug('Back to list (cancel) clicked', e); navigate('/instructor/mock-interview'); }}
                    aria-label="Back to Mock Interviews list"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    {isEditMode ? 'Update Mock Interview' : 'Create Mock Interview'}
                  </button>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}