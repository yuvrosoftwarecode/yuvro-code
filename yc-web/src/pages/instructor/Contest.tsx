import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Pencil, Trash2, Eye, Trophy, Users, Calendar, Building2, GraduationCap, Zap, Clock, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import SearchBar from '@/components/common/SearchBar';
import { useAuth } from "@/contexts/AuthContext";

interface Contest {
  id: string;
  title: string;
  organizer: string;
  type: 'company' | 'college' | 'weekly' | 'monthly';
  status: 'upcoming' | 'ongoing' | 'past';
  startDate: string;
  endDate: string;
  duration: string;
  participants: number;
  prize?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
}

const API_URL = import.meta.env.BACKEND_API_BASE_URL || 'http://localhost:8001/api/contests/';

function mapContestFromBackend(c: any): Contest {
  return {
    id: String(c.id),
    title: c.title,
    organizer: c.organizer,
    type: c.type,
    status: c.status,
    startDate: c.start_date,
    endDate: c.end_date,
    duration: c.duration ? `${Math.round((typeof c.duration === 'string' ? parseFloat(c.duration) : c.duration) / 60)} min` : '',
    participants: c.participants_count ?? 0,
    prize: c.prize ?? '',
    difficulty: c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1),
    description: c.description ?? '',
  };
}

export default function OwnerContest() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    organizer: '',
    type: 'company' as 'company' | 'college' | 'weekly' | 'monthly',
    status: 'upcoming' as 'upcoming' | 'ongoing' | 'past',
    startDate: '',
    endDate: '',
    duration: '',
    prize: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    description: ''
  });

  const fetchContests = () => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setContests(data.map(mapContestFromBackend));
        }
      })
      .catch(err => {
        console.error('Failed to fetch contests:', err);
      });
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const handleAddContest = async () => {
    const payload = {
      title: formData.title,
      organizer: formData.organizer,
      type: formData.type,
      status: formData.status,
      start_date: formData.startDate,
      end_date: formData.endDate,
      duration: formData.duration ? parseInt(formData.duration) * 60 : null, // expects seconds
      prize: formData.prize,
      difficulty: formData.difficulty.toLowerCase(),
      description: formData.description,
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Contest created successfully');
        fetchContests();
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        toast.error('Failed to create contest');
      }
    } catch (err) {
      toast.error('Failed to create contest');
    }
  };

  const handleEditContest = async () => {
    if (!editingContest) return;
    const payload = {
      title: formData.title,
      organizer: formData.organizer,
      type: formData.type,
      status: formData.status,
      start_date: formData.startDate,
      end_date: formData.endDate,
      duration: formData.duration ? parseInt(formData.duration) * 60 : null,
      prize: formData.prize,
      difficulty: formData.difficulty.toLowerCase(),
      description: formData.description,
    };

    try {
      const res = await fetch(`${API_URL}${editingContest.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Contest updated successfully');
        fetchContests();
        setEditingContest(null);
        resetForm();
      } else {
        toast.error('Failed to update contest');
      }
    } catch (err) {
      toast.error('Failed to update contest');
    }
  };

  const handleDeleteContest = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        toast.success('Contest deleted successfully');
        fetchContests();
      } else {
        toast.error('Failed to delete contest');
      }
    } catch (err) {
      toast.error('Failed to delete contest');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      organizer: '',
      type: 'company',
      status: 'upcoming',
      startDate: '',
      endDate: '',
      duration: '',
      prize: '',
      difficulty: 'Medium',
      description: ''
    });
  };

  const openEditDialog = (contest: Contest) => {
    setEditingContest(contest);
    setFormData({
      title: contest.title,
      organizer: contest.organizer,
      type: contest.type,
      status: contest.status,
      startDate: contest.startDate ? contest.startDate.slice(0, 10) : '', // Ensure YYYY-MM-DD
      endDate: contest.endDate ? contest.endDate.slice(0, 10) : '',
      duration: contest.duration,
      prize: contest.prize || '',
      difficulty: contest.difficulty,
      description: contest.description
    });
  };

  const filteredContests = contests.filter(contest => {
    const matchesSearch = contest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contest.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = selectedTab === 'all' || contest.status === selectedTab;
    return matchesSearch && matchesTab;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'company': return <Building2 className="h-4 w-4" />;
      case 'college': return <GraduationCap className="h-4 w-4" />;
      case 'weekly': return <Zap className="h-4 w-4" />;
      case 'monthly': return <Trophy className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'company': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'college': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'weekly': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'monthly': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-700 border-green-200';
      case 'upcoming': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'past': return 'bg-gray-100 text-gray-700 border-gray-200';
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

  return (
      <div className="min-h-screen">
        <Navigation />

        <div className="flex-1 p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Trophy className="h-8 w-8" />
                Contest Management
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage coding contests for students
              </p>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-white border border-gray-200 text-black shadow-lg  transition-all duration-200 rounded-lg px-5 py-2 font-semibold text-base">
                  <Plus className="h-5 w-5" />
                    <span className="tracking-wide">Create Contest</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-5 rounded-2xl shadow-2xl border border-gray-200">
                <DialogHeader>
                  <DialogTitle>Create New Contest</DialogTitle>
                  <DialogDescription>Fill out the contest details below.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">

                {/* Contest Title */}
                    <div className="grid gap-2">
                      <Label>Contest Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="e.g., Weekly Coding Challenge"
                        className="border border-gray-400 rounded-md"
                      />
                    </div>

                    {/* Organizer + Contest Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Organizer</Label>
                        <Input
                          value={formData.organizer}
                          onChange={(e) =>
                            setFormData({ ...formData, organizer: e.target.value })
                          }
                          placeholder="e.g., Yuvro Platform"
                          className="border border-gray-400 rounded-md"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Contest Type</Label>
                        <select
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value as any })
                          }
                          className="rounded-md border border-gray-400 px-3 py-2 bg-white"
                        >
                          <option value="company">Company</option>
                          <option value="college">College</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    </div>

                    {/* Start Date + End Date */}
                    <div className="grid grid-cols-2 gap-4">

                      {/* Start Date */}
                      <div className="grid gap-2">
                        <Label>Start Date</Label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) =>
                              setFormData({ ...formData, startDate: e.target.value })
                            }
                            className="border border-gray-400 rounded-md pr-10"
                          />

                          {/* Custom Calendar Icon */}
                          <button
                            type="button"
                            onClick={(e) => {
                              (e.currentTarget.previousSibling as HTMLInputElement)
                                ?.showPicker?.();
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <CalendarIcon className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>
                      </div>

                      {/* End Date */}
                      <div className="grid gap-2">
                        <Label>End Date</Label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) =>
                              setFormData({ ...formData, endDate: e.target.value })
                            }
                            className="border border-gray-400 rounded-md pr-10"
                          />

                          <button
                            type="button"
                            onClick={(e) => {
                              (e.currentTarget.previousSibling as HTMLInputElement)
                                ?.showPicker?.();
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <CalendarIcon className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Duration + Prize */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Duration</Label>
                        <Input
                          value={formData.duration}
                          onChange={(e) =>
                            setFormData({ ...formData, duration: e.target.value })
                          }
                          placeholder="e.g., 2 hours"
                          className="border border-gray-400 rounded-md"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Prize (Optional)</Label>
                        <Input
                          value={formData.prize}
                          onChange={(e) =>
                            setFormData({ ...formData, prize: e.target.value })
                          }
                          placeholder="e.g., ₹50,000"
                          className="border border-gray-400 rounded-md"
                        />
                      </div>
                    </div>

                    {/* Difficulty + Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Difficulty</Label>
                        <select
                          value={formData.difficulty}
                          onChange={(e) =>
                            setFormData({ ...formData, difficulty: e.target.value as any })
                          }
                          className="border border-gray-400 rounded-md px-3 py-2 bg-white"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Status</Label>
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({ ...formData, status: e.target.value as any })
                          }
                          className="border border-gray-400 rounded-md px-3 py-2 bg-white"
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="past">Past</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Describe the contest focus and topics..."
                        rows={4}
                        className="border border-gray-400 rounded-md p-2"
                      />
                    </div>
                  </div>

                  {/* Footer */}
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

                    <Button onClick={handleAddContest} className="border border-gray-400 bg-black text-white">Create</Button>
                  </div>
                  </DialogContent>
          </Dialog>

          </div>

          

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-md font-medium text-gray-600">Total Contests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold">{contests.length}</div>
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-md font-medium text-gray-600">Upcoming</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold">{contests.filter(c => c.status === 'upcoming').length}</div>
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
                  <div className="text-2xl font-bold text-green-600">{contests.filter(c => c.status === 'ongoing').length}</div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-md font-medium text-gray-600">Total Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold">{contests.reduce((sum, c) => sum + c.participants, 0)}</div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex w-full items-center gap-4 h-12">
              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex items-center border border-gray-200 rounded-lg">
                <TabsList className="flex rounded-lg overflow-hidden border border-gray-200 bg-white px-4 gap-4 h-full items-center">
                  <TabsTrigger
                    className={`px-5 h-8 text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center
                      ${selectedTab === 'all' ? 'bg-gray-200 text-gray-900 shadow-sm' : 'bg-white text-gray-600'}
                      first:rounded-lg last:rounded-lg`}
                    value="all"
                  >
                    All Contests
                  </TabsTrigger>

                  <TabsTrigger
                    className={`px-5 h-8 text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center
                      ${selectedTab === 'upcoming' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'bg-white text-gray-600'}
                      `}
                    value="upcoming"
                  >
                    Upcoming
                  </TabsTrigger>

                  <TabsTrigger
                    className={`px-5 h-8 text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center
                      ${selectedTab === 'ongoing' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'bg-white text-gray-600'}
                      `}
                    value="ongoing"
                  >
                    Ongoing
                  </TabsTrigger>

                  <TabsTrigger
                    className={`px-5 h-8 text-sm font-medium rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center
                      ${selectedTab === 'past' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'bg-white text-gray-600'}
                      last:rounded-lg`}
                    value="past"
                  >
                    Past
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="group relative h-full flex items-center">
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              </div>
            </div>
          </div>

          <Card className="border border-gray-200 rounded-lg">
            <CardHeader className="pb-1">
              <CardTitle className="text-2xl font-semibold">Contests</CardTitle>
              <CardDescription className="text-gray-600">
                {filteredContests.length} contest(s) found
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0 px-0 pb-0 p-5">
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <Table className="border border-gray-200 rounded-lg">
                  <TableHeader>
                    <TableRow className="border border-gray-200">
                      <TableHead>Contest Title</TableHead>
                      <TableHead>Organizer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContests.map((contest) => (
                      <TableRow className="border border-gray-200" key={contest.id}>
                        <TableCell className="font-medium">{contest.title}</TableCell>
                        <TableCell>{contest.organizer}</TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(contest.type)} variant="outline">
                            <span className="mr-1">{getTypeIcon(contest.type)}</span>
                            {contest.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(contest.status)} variant="outline">
                            {contest.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDifficultyColor(contest.difficulty)} variant="outline">
                            {contest.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(contest.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {contest.participants}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toast.info('View leaderboard feature coming soon')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(contest)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit Contest</DialogTitle>
                                  <DialogDescription>Update the contest details below.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <Label>Contest Title</Label>
                                    <Input
                                      value={formData.title}
                                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <Label>Organizer</Label>
                                      <Input
                                        value={formData.organizer}
                                        onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label>Contest Type</Label>
                                      <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                                      >
                                        <option value="company">Company</option>
                                        <option value="college">College</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <Label>Start Date</Label>
                                      <Input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                      />
                                      className="border border-gray-400 rounded-md pr-10"
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        const input = e.currentTarget.previousSibling as HTMLInputElement;
                                        if (input?.showPicker) {
                                          input.showPicker();

                                          // Ensure React receives the updated value
                                          input.addEventListener(
                                            "input",
                                            () => {
                                              setFormData((prev) => ({
                                                ...prev,
                                                startDate: input.value,
                                              }));
                                            },
                                            { once: true }
                                          );
                                        }
                                      }}
                                      className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                      <CalendarIcon className="w-5 h-5 text-gray-500" />
                                    </button>

                                    <div className="grid gap-2">
                                      <Label>End Date</Label>
                                      <Input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                      />
                                      className="border border-gray-400 rounded-md pr-10"
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        const input = e.currentTarget.previousSibling as HTMLInputElement;
                                        if (input?.showPicker) {
                                          input.showPicker();
                                          input.addEventListener(
                                            "input",
                                            () => {
                                              setFormData((prev) => ({
                                                ...prev,
                                                endDate: input.value,
                                              }));
                                            },
                                            { once: true }
                                          );
                                        }
                                      }}
                                      className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                      <CalendarIcon className="w-5 h-5 text-gray-500" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <Label>Duration</Label>
                                      <Input
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label>Prize (Optional)</Label>
                                      <Input
                                        value={formData.prize}
                                        onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <Label>Difficulty</Label>
                                      <select
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                                      >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                      </select>
                                    </div>
                                    <div className="grid gap-2">
                                      <Label>Status</Label>
                                      <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                                      >
                                        <option value="upcoming">Upcoming</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="past">Past</option>
                                      </select>
                                    </div>
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
                                  <Button variant="outline" onClick={() => { setEditingContest(null); resetForm(); }}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleEditContest}>Update</Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this contest?')) {
                                  handleDeleteContest(contest.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
  );
}
