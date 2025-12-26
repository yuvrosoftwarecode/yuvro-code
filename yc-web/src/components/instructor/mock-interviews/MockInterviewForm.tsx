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





export default function InterviewsForm() {
  const navigate = useNavigate();
  const { mockInterviewId } = useParams<{ mockInterviewId: string }>();
  const isEditMode = !!mockInterviewId;

  const [currentFormTab, setCurrentFormTab] = useState('details');
  const [loading, setLoading] = useState(false);

  // Form State matching the new model
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    max_duration: 30, // Default 30 mins

    // AI Config
    ai_generation_mode: 'full_ai' as 'full_ai' | 'mixed' | 'predefined',
    ai_verbal_question_count: 5,
    ai_coding_question_count: 1,

    // Voice Config
    voice_type: 'junnu' as 'junnu' | 'munnu',
    voice_speed: 1.0,

    // Skills (comma separated for input)
    required_skills: '',
    optional_skills: '',

    // Publish
    publish_status: 'draft' as 'draft' | 'active' | 'inactive' | 'archived',

    questions_config: {} as any,
    questions_random_config: {} as any
  });

  const getHeaderTitle = () => {
    return isEditMode ? `Edit Mock Interview` : 'Add New Mock Interview';
  };

  const getHeaderSubtitle = () => {
    return isEditMode ? 'Modify mock interview settings' : 'Configure a new AI-driven mock interview';
  };

  useEffect(() => {
    if (!isEditMode) return;

    const fetchMockInterview = async () => {
      if (!mockInterviewId) return;

      setLoading(true);
      try {
        const data = await mockInterviewService.getMockInterview(mockInterviewId);
        setFormData({
          title: data.title,
          description: data.description,
          instructions: data.instructions || '',
          max_duration: data.max_duration || 30,

          ai_generation_mode: data.ai_generation_mode || 'full_ai',
          ai_verbal_question_count: data.ai_verbal_question_count || 5,
          ai_coding_question_count: data.ai_coding_question_count || 1,

          voice_type: data.voice_type || 'junnu',
          voice_speed: data.voice_speed || 1.0,

          required_skills: (data.required_skills || []).join(', '),
          optional_skills: (data.optional_skills || []).join(', '),

          publish_status: data.publish_status || 'draft',
          questions_config: data.questions_config || {},
          questions_random_config: data.questions_random_config || {}
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

      const payload: any = {
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        max_duration: Number(formData.max_duration),

        ai_generation_mode: formData.ai_generation_mode,
        ai_verbal_question_count: Number(formData.ai_verbal_question_count),
        ai_coding_question_count: Number(formData.ai_coding_question_count),

        voice_type: formData.voice_type,
        voice_speed: Number(formData.voice_speed),

        required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        optional_skills: formData.optional_skills.split(',').map(s => s.trim()).filter(Boolean),

        publish_status: formData.publish_status,
        questions_config: formData.questions_config,
        questions_random_config: formData.questions_random_config
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
      console.error('Failed to save :', error);
      toast.error('Failed to save mock interview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <RoleSidebar />
        <div className="flex-1">
          <RoleHeader
            title={getHeaderTitle()}
            subtitle={getHeaderSubtitle()}
            actions={
              <button
                type="button"
                onClick={() => navigate('/instructor/mock-interview')}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                ← Back to List
              </button>
            }
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow rounded-lg mb-6 p-6">
              <Tabs value={currentFormTab} onValueChange={setCurrentFormTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger value="details">Basic Info</TabsTrigger>
                  <TabsTrigger value="ai_config">AI Config</TabsTrigger>
                  <TabsTrigger value="voice_config">Voice & Audio</TabsTrigger>
                  <TabsTrigger value="questions">Questions</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-blue-500" /> Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Title *</label>
                          <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Frontend Developer Interview" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Max Duration (minutes) *</label>
                          <Input type="number" value={formData.max_duration} onChange={e => setFormData({ ...formData, max_duration: parseInt(e.target.value) })} min={5} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Description of the interview..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Instructions *</label>
                        <Textarea value={formData.instructions} onChange={e => setFormData({ ...formData, instructions: e.target.value })} placeholder="Instructions for the candidate..." />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Required Skills (Comma separated)</label>
                          <Input value={formData.required_skills} onChange={e => setFormData({ ...formData, required_skills: e.target.value })} placeholder="React, TypeScript, CSS" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Optional Skills (Comma separated)</label>
                          <Input value={formData.optional_skills} onChange={e => setFormData({ ...formData, optional_skills: e.target.value })} placeholder="Redux, Node.js" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Publish Status</label>
                        <select value={formData.publish_status} onChange={e => setFormData({ ...formData, publish_status: e.target.value as any })} className="w-full border rounded px-3 py-2">
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* AI Config Tab */}
                <TabsContent value="ai_config" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-500" /> AI Generation Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Generation Mode</label>
                        <select value={formData.ai_generation_mode} onChange={e => setFormData({ ...formData, ai_generation_mode: e.target.value as any })} className="w-full border rounded px-3 py-2">
                          <option value="full_ai">Full AI (AI decides everything based on skills)</option>
                          <option value="mixed">Mixed (AI + Predefined Questions)</option>
                          <option value="predefined">Predefined Questions Only</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Verbal Questions Count</label>
                          <Input type="number" value={formData.ai_verbal_question_count} onChange={e => setFormData({ ...formData, ai_verbal_question_count: parseInt(e.target.value) })} min={0} />
                          <p className="text-xs text-gray-500 mt-1">Number of verbal/theory questions AI should generate.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Coding Questions Count</label>
                          <Input type="number" value={formData.ai_coding_question_count} onChange={e => setFormData({ ...formData, ai_coding_question_count: parseInt(e.target.value) })} min={0} />
                          <p className="text-xs text-gray-500 mt-1">Number of coding challenges AI should generate.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Voice Config Tab */}
                <TabsContent value="voice_config" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-green-500" /> Voice & Audio Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Interviewer Voice</label>
                          <select value={formData.voice_type} onChange={e => setFormData({ ...formData, voice_type: e.target.value as any })} className="w-full border rounded px-3 py-2">
                            <option value="junnu">Junnu (Male - Indian Accent)</option>
                            <option value="munnu">Munnu (Female - US Accent)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Voice Speed (0.5x - 2.0x)</label>
                          <Input type="number" value={formData.voice_speed} onChange={e => setFormData({ ...formData, voice_speed: parseFloat(e.target.value) })} min={0.5} max={2.0} step={0.1} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Questions Tab */}
                <TabsContent value="questions" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-purple-500" /> Question Bank</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {formData.ai_generation_mode === 'full_ai' && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4 text-sm text-yellow-800">
                          Note: In "Full AI" mode, specific questions selected here might be ignored or used only as context. Use "Mixed" mode to enforce specific questions.
                        </div>
                      )}
                      <p className="mb-4 text-sm text-gray-600">Select questions from the bank if you want to include specific challenges.</p>
                      <QuestionBank mode="selection" allowMultipleSelection={true} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/instructor/mock-interview')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isEditMode ? 'Update Mock Interview' : 'Create Mock Interview'}
                  </Button>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}