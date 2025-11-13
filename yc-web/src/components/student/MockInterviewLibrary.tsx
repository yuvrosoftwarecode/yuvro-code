import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Play, Star, Clock, Users } from 'lucide-react';
import PermissionDialog from './PermissionDialog';
import InterviewScreen from './InterviewScreen';
import ThankYouScreen from './ThankYouScreen';
import ReportsScreen from './ReportsScreen';

interface Role {
  id: number;
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  icon?: string;
  iconBg?: string;
  iconColor?: string;
}

interface MockInterviewLibraryProps {
  onStartInterview?: (role: Role, settings: any) => void;
}

interface InterviewSettings {
  difficulty: string;
  duration: string;
  interviewer: string;
  mediaStream: MediaStream;
}

const MockInterviewLibrary: React.FC<MockInterviewLibraryProps> = ({ onStartInterview }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedInterviewer, setSelectedInterviewer] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showInterviewScreen, setShowInterviewScreen] = useState(false);
  const [showThankYouScreen, setShowThankYouScreen] = useState(false);
  const [showReportsScreen, setShowReportsScreen] = useState(false);
  const [interviewSettings, setInterviewSettings] = useState<InterviewSettings | null>(null);

  const mockRoles: Role[] = [
    {
      id: 1,
      title: "Java Developer",
      description: "Master Java programming fundamentals, object-oriented design, and enterprise development patterns.",
      category: "Programming",
      level: "Intermediate",
      icon: "☕",
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400"
    },
    {
      id: 2,
      title: "Python Developer", 
      description: "Learn Python programming, data structures, algorithms, and web development with Django/Flask.",
      category: "Programming",
      level: "Beginner",
      icon: "🐍",
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600 dark:text-yellow-400"
    },
    {
      id: 3,
      title: "Frontend Developer",
      description: "Master HTML, CSS, JavaScript, React, and modern frontend development practices.",
      category: "Web Development", 
      level: "Intermediate",
      icon: "⚛️",
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      iconColor: "text-cyan-600 dark:text-cyan-400"
    },
    {
      id: 4,
      title: "Data Scientist",
      description: "Learn data analysis, machine learning, statistical modeling, and data visualization.",
      category: "Data Science",
      level: "Advanced",
      icon: "📊",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      id: 5,
      title: "System Design Engineer",
      description: "Master distributed systems, scalability, microservices, and system architecture patterns.",
      category: "System Design",
      level: "Advanced",
      icon: "🏗️",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      id: 6,
      title: "DevOps Engineer",
      description: "Learn CI/CD pipelines, containerization, cloud platforms, and infrastructure automation.",
      category: "DevOps",
      level: "Intermediate",
      icon: "⚙️",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400"
    }
  ];

  const filteredRoles = mockRoles.filter(role =>
    role.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartPracticeClick = (role: Role) => {
    setSelectedRole(role);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    console.log('Closing modal');
    setShowModal(false);
    setSelectedRole(null);
    setSelectedDifficulty('');
    setSelectedDuration('');
    setSelectedInterviewer('');
    setAgreeToTerms(false);
  };

  const handleProceedWithInterview = () => {
    console.log('Proceeding with interview');
    setShowPermissionDialog(false);
    setShowInterviewScreen(true);
  };

  const handleCancelInterview = () => {
    console.log('Canceling interview');
    setShowPermissionDialog(false);
    // Stop media stream if exists
    if (interviewSettings?.mediaStream) {
      interviewSettings.mediaStream.getTracks().forEach(track => track.stop());
    }
    setInterviewSettings(null);
    setSelectedRole(null); // Reset selected role only when canceling
  };

  const handleExitInterview = () => {
    setShowInterviewScreen(false);
    setShowThankYouScreen(true); // Show thank you page when exiting
  };

  const handleInterviewComplete = (role: Role, difficulty: string, duration: string) => {
    setShowInterviewScreen(false);
    setShowThankYouScreen(true);
  };

  const handleViewReports = () => {
    setShowThankYouScreen(false);
    setShowReportsScreen(true);
  };

  const handleTryAgain = () => {
    setShowThankYouScreen(false);
    setShowReportsScreen(false);
    setShowInterviewScreen(true);
  };

  const handleBackToLibrary = () => {
    // Reset all states when going back to library
    setShowInterviewScreen(false);
    setShowThankYouScreen(false);
    setShowReportsScreen(false);
    setInterviewSettings(null);
    setSelectedRole(null);
    
    // Stop media stream if exists
    if (interviewSettings?.mediaStream) {
      interviewSettings.mediaStream.getTracks().forEach(track => track.stop());
    }
  };

  const handleStartInterview = async () => {
    console.log('handleStartInterview called');
    if (!selectedDifficulty || !selectedDuration || !selectedInterviewer || !agreeToTerms) {
      alert('Please fill in all required fields and agree to terms.');
      return;
    }

    try {
      console.log('Requesting media permissions...');
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log('Permissions granted, stream received:', stream);
      // If we get here, permissions were granted
      const settings: InterviewSettings = {
        difficulty: selectedDifficulty,
        duration: selectedDuration,
        interviewer: selectedInterviewer,
        mediaStream: stream
      };

      console.log('Setting interview settings and showing permission dialog');
      setInterviewSettings(settings);
      
      // Close modal but keep selectedRole
      setShowModal(false);
      setSelectedDifficulty('');
      setSelectedDuration('');
      setSelectedInterviewer('');
      setAgreeToTerms(false);
      
      // Use setTimeout to ensure modal is closed before showing permission dialog
      setTimeout(() => {
        console.log('Setting showPermissionDialog to true');
        setShowPermissionDialog(true);
      }, 100);
      
    } catch (error) {
      console.error('Failed to get media permissions:', error);
      alert('Camera and microphone access is required for the interview. Please grant permissions and try again.');
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'Beginner': return 'secondary';
      case 'Intermediate': return 'default';
      case 'Advanced': return 'destructive';
      default: return 'secondary';
    }
  };

  // Show reports screen if active
  if (showReportsScreen && selectedRole && interviewSettings) {
    return (
      <ReportsScreen
        role={selectedRole}
        difficulty={interviewSettings.difficulty}
        duration={interviewSettings.duration}
        onTryAgain={handleTryAgain}
        onBackToLibrary={handleBackToLibrary}
      />
    );
  }

  // Show thank you screen if active
  if (showThankYouScreen && selectedRole && interviewSettings) {
    return (
      <ThankYouScreen
        role={selectedRole}
        difficulty={interviewSettings.difficulty}
        duration={interviewSettings.duration}
        onViewReports={handleViewReports}
        onTryAgain={handleTryAgain}
        onBackToLibrary={handleBackToLibrary}
      />
    );
  }

  // Show interview screen if active
  if (showInterviewScreen && selectedRole && interviewSettings) {
    return (
      <InterviewScreen
        role={selectedRole}
        difficulty={interviewSettings.difficulty}
        duration={interviewSettings.duration}
        interviewer={interviewSettings.interviewer}
        mediaStream={interviewSettings.mediaStream}
        onExit={handleExitInterview}
        onInterviewComplete={handleInterviewComplete}
      />
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Mock Interview
        </h1>
        <p className="text-muted-foreground">
          Choose a role to start practicing your interview skills
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <Card
            key={role.id}
            className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border border-border overflow-hidden"
          >
            <div className="p-6 space-y-4">
              {/* Role Icon - Neumorphism Style */}
              <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${role.iconBg || 'bg-muted'} shadow-inner text-4xl ${role.iconColor || ''}`}>
                {role.icon || '💼'}
              </div>

              {/* Role Info */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-saffron-start transition-colors">
                    {role.title}
                  </h3>
                  <span className="text-sm text-muted-foreground/70">
                    {role.level}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {role.description}
                </p>
              </div>

              {/* Start Button */}
              <Button
                onClick={() => handleStartPracticeClick(role)}
                className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white border-0 hover:opacity-90 transition-opacity duration-300"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Practice
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Interview Setup Modal */}
      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Setup</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Role Information */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{selectedRole?.title}</h3>
              <Badge variant="secondary" className="w-fit">
                Role Related
              </Badge>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-3">
              <h4 className="font-medium">Difficulty Level *</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['Fresher', 'Beginner (1-3yrs)', 'Professional (3+ years)'].map((difficulty) => (
                  <Button
                    key={difficulty}
                    variant={selectedDifficulty === difficulty ? "default" : "outline"}
                    onClick={() => setSelectedDifficulty(difficulty)}
                    className="justify-start"
                  >
                    {difficulty}
                  </Button>
                ))}
              </div>
            </div>

            {/* Interview Duration */}
            <div className="space-y-3">
              <h4 className="font-medium">Interview Duration *</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: '5 mins', label: '5 mins' },
                  { value: '15 mins', label: '15 mins', premium: true },
                  { value: '30 mins', label: '30 mins', premium: true }
                ].map((duration) => (
                  <Button
                    key={duration.value}
                    variant={selectedDuration === duration.value ? "default" : "outline"}
                    onClick={() => setSelectedDuration(duration.value)}
                    className="justify-between"
                  >
                    <span>{duration.label}</span>
                    {duration.premium && <Star className="h-4 w-4 text-yellow-500" />}
                  </Button>
                ))}
              </div>
            </div>

            {/* Select Interviewer */}
            <div className="space-y-3">
              <h4 className="font-medium">Select Your Interviewer *</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: 'Junnu', name: 'Junnu', accent: 'IN English' },
                  { id: 'Munnu', name: 'Munnu', accent: 'US English' }
                ].map((interviewer) => (
                  <Card 
                    key={interviewer.id}
                    className={`cursor-pointer transition-colors ${
                      selectedInterviewer === interviewer.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedInterviewer(interviewer.id)}
                  >
                    <CardContent className="flex items-center space-x-3 p-4">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {interviewer.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{interviewer.name}</p>
                        <p className="text-sm text-muted-foreground">{interviewer.accent}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="terms" className="text-sm">
                I agree with the <span className="text-primary underline cursor-pointer">terms and conditions</span>.
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <Button variant="outline" onClick={handleCloseModal} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleStartInterview}
                disabled={!selectedDifficulty || !selectedDuration || !selectedInterviewer || !agreeToTerms}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Practice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permission Dialog */}
      <PermissionDialog
        open={showPermissionDialog}
        onConfirm={handleProceedWithInterview}
        onCancel={handleCancelInterview}
      />
    </div>
  );
};

export default MockInterviewLibrary;