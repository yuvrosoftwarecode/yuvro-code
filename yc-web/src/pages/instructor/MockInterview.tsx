import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Pencil, Trash2, Eye, Video, Users, Calendar, Clock, CalendarIcon, Play, Square, X } from 'lucide-react';
import { toast } from 'sonner';
import RoleSidebar from '@/components/common/RoleSidebar';
import RoleHeader from '@/components/common/RoleHeader';
import SearchBar from '@/components/common/SearchBar';
import { useAuth } from "@/contexts/AuthContext";
import { mockInterviewService, MockInterview, CreateMockInterviewData } from '@/services/mockInterviewService';

export default function InstructorMockInterview() {
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<MockInterview | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'technical' as 'technical' | 'behavioral' | 'system_design' | 'coding',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    scheduled_date: '',
    duration: 60,
    interviewee: '',
    meeting_link: '',
    meeting_id: '',
    questions: [] as any[]
  });

  const fetchInterviews = async () => {
    try {
      const data = await mockInterviewService.getAllMockInterviews();
      setInterviews(data);
    } catch (err) {
      console.error('Failed to fetch mock interviews:', err);
      toast.error('Failed to fetch mock interviews');
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleAddInterview = async () => {
    const payload: CreateMockInterviewData = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      difficulty: formData.difficulty,
      scheduled_date: formData.scheduled_date,
      duration: formData.duration,
      interviewee: formData.interviewee || undefined,
      meeting_link: formData.meeting_link,
      meeting_id: formData.meeting_id,
      questions: formData.questions,
    };

    try {
      await mockInterviewService.createMockInterview(payload);
      toast.success('Mock interview created successfully');
      fetchInterviews();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error('Failed to create mock interview');
    }
  };

  const handleEditInterview = async () => {
    if (!editingInterview) return;
    
    const payload = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      difficulty: formData.difficulty,
      scheduled_date: formData.scheduled_date,
      duration: formData.duration,
      interviewee: formData.interviewee || undefined,
      meeting_link: formData.meeting_link,
      meeting_id: formData.meeting_id,
      questions: formData.questions,
    };

    try {
      await mockInterviewService.updateMockInterview(editingInterview.id, payload);
      toast.success('Mock interview updated successfully');
      fetchInterviews();
      setEditingInterview(null);
      resetForm();
    } catch (err) {
      toast.error('Failed to update mock interview');
    }
  };

  const handleDeleteInterview = async (id: string) => {
    try {
      await mockInterviewService.deleteMockInterview(id);
      toast.success('Mock interview deleted successfully');
      fetchInterviews();
    } catch (err) {
      toast.error('Failed to delete mock interview');
    }
  };

  const handleStartInterview = async (id: string) => {
    try {
      await mockInterviewService.startInterview(id);
      toast.success('Interview started successfully');
      fetchInterviews();
    } catch (err) {
      toast.error('Failed to start interview');
    }
  };

  const handleCancelInterview = async (id: string) => {
    try {
      await mockInterviewService.cancelInterview(id);
      toast.success('Interview cancelled successfully');
      fetchInterviews();
    } catch (err) {
      toast.error('Failed to cancel interview');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'technical',
      difficulty: 'medium',
      scheduled_date: '',
      duration: 60,
      interviewee: '',
      meeting_link: '',
      meeting_id: '',
      questions: []
    });
  };

  const openEditDialog = (interview: MockInterview) => {
    setEditingInterview(interview);
    setFormData({
      title: interview.title,
      description: interview.description,
      type: interview.type,
      difficulty: interview.difficulty,
      scheduled_date: interview.scheduled_date ? new Date(interview.scheduled_date).toISOString().slice(0, 16) : '',
      duration: interview.duration,
      interviewee: interview.interviewee || '',
      meeting_link: interview.meeting_link,
      meeting_id: interview.meeting_id,
      questions: interview.questions || []
    });
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = interview.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (interview.interviewee_details?.first_name + ' ' + interview.interviewee_details?.last_name).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = selectedTab === 'all' || interview.status === selectedTab;
    return matchesSearch && matchesTab;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'technical': return <Video className="h-4 w-4" />;
      case 'behavioral': return <Users className="h-4 w-4" />;
      case 'system_design': return <Eye className="h-4 w-4" />;
      case 'coding': return <Play className="h-4 w-4" />;
      default: return <Video className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'behavioral': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'system_design': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'coding': return 'bg-green-100 text-green-700 border-green-200';
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <RoleSidebar />
        <div className="flex-1">
          <RoleHeader
            title="Mock Interview Management"
            subtitle="Schedule and manage mock interviews for students"
          />
          <div className="p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex-1"></div>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-white border border-gray-200 text-black shadow-lg transition-all duration-200 rounded-lg px-5 py-2 font-semibold text-base">
                    <Plus className="h-5 w-5" />
                    <span className="tracking-wide">Schedule Interview</span>
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-5 rounded-2xl shadow-2xl border border-gray-200">
                  <DialogHeader>
                    <DialogTitle>Schedule New Mock Interview</DialogTitle>
                    <DialogDescription>Fill out the interview details below.</DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label>Interview Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Frontend Developer Technical Interview"
                        className="border border-gray-400 rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Interview Type</Label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                          className="rounded-md border border-gray-400 px-3 py-2 bg-white"
                        >
                          <option value="technical">Technical</option>
                          <option value="behavioral">Behavioral</option>
                          <option value="system_design">System Design</option>
                          <option value="coding">Coding</option>
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Difficulty</Label>
                        <select
                          value={formData.difficulty}
                          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                          className="border border-gray-400 rounded-md px-3 py-2 bg-white"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Scheduled Date & Time</Label>
                        <div className="relative">
                          <Input
                            type="datetime-local"
                            value={formData.scheduled_date}
                            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                            className="border border-gray-400 rounded-md pr-10"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              (e.currentTarget.previousSibling as HTMLInputElement)?.showPicker?.();
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <CalendarIcon className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                          placeholder="60"
                          className="border border-gray-400 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Meeting Link</Label>
                        <Input
                          value={formData.meeting_link}
                          onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                          placeholder="https://meet.google.com/..."
                          className="border border-gray-400 rounded-md"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Meeting ID (Optional)</Label>
                        <Input
                          value={formData.meeting_id}
                          onChange={(e) => setFormData({ ...formData, meeting_id: e.target.value })}
                          placeholder="Meeting ID or Room Code"
                          className="border border-gray-400 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Interviewee Email (Optional)</Label>
                      <Input
                        value={formData.interviewee}
                        onChange={(e) => setFormData({ ...formData, interviewee: e.target.value })}
                        placeholder="student@example.com"
                        className="border border-gray-400 rounded-md"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the interview focus and topics..."
                        rows={4}
                        className="border border-gray-400 rounded-md p-2"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        resetForm();
                      }}
                      className="border border-gray-400"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddInterview} className="border border-gray-400 bg-black text-white">
                      Schedule
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-md font-medium text-gray-600">Total Interviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold">{interviews.length}</div>
                    <Video className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-md font-medium text-gray-600">Scheduled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold">{interviews.filter(i => i.status === 'scheduled').length}</div>
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
                    <div className="text-2xl font-bold text-green-600">{interviews.filter(i => i.status === 'ongoing').length}</div>
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
                    <div className="text-xl font-bold">{interviews.filter(i => i.status === 'completed').length}</div>
                    <Square className="h-8 w-8 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs and Search */}
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

            {/* Interviews Table */}
            <Card className="border border-gray-200 rounded-lg">
              <CardHeader className="pb-1">
                <CardTitle className="text-2xl font-semibold">Mock Interviews</CardTitle>
                <CardDescription className="text-gray-600">
                  {filteredInterviews.length} interview(s) found
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 px-0 pb-0 p-5">
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <Table className="border border-gray-200 rounded-lg">
                    <TableHeader>
                      <TableRow className="border border-gray-200">
                        <TableHead>Interview Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Interviewee</TableHead>
                        <TableHead>Scheduled Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInterviews.map((interview) => (
                        <TableRow className="border border-gray-200" key={interview.id}>
                          <TableCell className="font-medium">{interview.title}</TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(interview.type)} variant="outline">
                              <span className="mr-1">{getTypeIcon(interview.type)}</span>
                              {interview.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getDifficultyColor(interview.difficulty)} variant="outline">
                              {interview.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(interview.status)} variant="outline">
                              {interview.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {interview.interviewee_details ? 
                              `${interview.interviewee_details.first_name} ${interview.interviewee_details.last_name}` : 
                              'Not assigned'
                            }
                          </TableCell>
                          <TableCell>{new Date(interview.scheduled_date).toLocaleString()}</TableCell>
                          <TableCell>{interview.duration} min</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {interview.status === 'scheduled' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStartInterview(interview.id)}
                                  title="Start Interview"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              {interview.status === 'scheduled' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCancelInterview(interview.id)}
                                  title="Cancel Interview"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(interview)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Edit Mock Interview</DialogTitle>
                                    <DialogDescription>Update the interview details below.</DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label>Interview Title</Label>
                                      <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="grid gap-2">
                                        <Label>Type</Label>
                                        <select
                                          value={formData.type}
                                          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                                        >
                                          <option value="technical">Technical</option>
                                          <option value="behavioral">Behavioral</option>
                                          <option value="system_design">System Design</option>
                                          <option value="coding">Coding</option>
                                        </select>
                                      </div>
                                      <div className="grid gap-2">
                                        <Label>Difficulty</Label>
                                        <select
                                          value={formData.difficulty}
                                          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                                        >
                                          <option value="easy">Easy</option>
                                          <option value="medium">Medium</option>
                                          <option value="hard">Hard</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="grid gap-2">
                                      <Label>Scheduled Date & Time</Label>
                                      <Input
                                        type="datetime-local"
                                        value={formData.scheduled_date}
                                        onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label>Description</Label>
                                      <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingInterview(null);
                                        resetForm();
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button onClick={handleEditInterview}>Update</Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteInterview(interview.id)}
                                title="Delete Interview"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}