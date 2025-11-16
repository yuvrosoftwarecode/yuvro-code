import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';

interface Contest {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  duration: number; // in minutes
  participants: number;
  max_participants?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  prize_pool: string;
  status: 'upcoming' | 'live' | 'completed';
  problems: number;
  registered: boolean;
}

const SAMPLE_CONTESTS: Contest[] = [
  {
    id: 1,
    title: 'Weekly Coding Challenge #45',
    description: 'Test your algorithmic skills with a variety of programming problems ranging from easy to hard difficulty.',
    start_time: '2024-02-20T14:00:00Z',
    end_time: '2024-02-20T16:00:00Z',
    duration: 120,
    participants: 1247,
    max_participants: 2000,
    difficulty: 'medium',
    prize_pool: '$500',
    status: 'upcoming',
    problems: 4,
    registered: false
  },
  {
    id: 2,
    title: 'Data Structures Sprint',
    description: 'Focus on data structure problems including arrays, linked lists, trees, and graphs.',
    start_time: '2024-02-18T10:00:00Z',
    end_time: '2024-02-18T11:30:00Z',
    duration: 90,
    participants: 892,
    difficulty: 'hard',
    prize_pool: '$1000',
    status: 'live',
    problems: 3,
    registered: true
  },
  {
    id: 3,
    title: 'Beginner Friendly Contest',
    description: 'Perfect for newcomers to competitive programming. Easy to medium difficulty problems.',
    start_time: '2024-02-15T16:00:00Z',
    end_time: '2024-02-15T18:00:00Z',
    duration: 120,
    participants: 2156,
    difficulty: 'easy',
    prize_pool: '$250',
    status: 'completed',
    problems: 5,
    registered: true
  }
];

const Contest: React.FC = () => {
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>(SAMPLE_CONTESTS);
  const [selectedTab, setSelectedTab] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filteredContests = selectedTab === 'all' 
    ? contests 
    : contests.filter(contest => contest.status === selectedTab);

  const registerForContest = (contestId: number) => {
    setContests(prev => prev.map(contest => 
      contest.id === contestId 
        ? { ...contest, registered: true, participants: contest.participants + 1 }
        : contest
    ));
  };

  const unregisterFromContest = (contestId: number) => {
    setContests(prev => prev.map(contest => 
      contest.id === contestId 
        ? { ...contest, registered: false, participants: contest.participants - 1 }
        : contest
    ));
  };

  const joinContest = (contestId: number) => {
    // In a real application, this would redirect to the contest platform
    alert('Redirecting to contest platform...');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'text-blue-600 bg-blue-100';
      case 'live': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilStart = (startTime: string) => {
    const start = new Date(startTime);
    const now = currentTime;
    const diff = start.getTime() - now.getTime();

    if (diff <= 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Programming Contests</h1>
          <p className="text-gray-600 mt-2">Compete with developers worldwide and win prizes</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {(['all', 'upcoming', 'live', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${selectedTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Contest Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredContests.map((contest) => (
            <div key={contest.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{contest.title}</h3>
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${getStatusColor(contest.status)}
                    `}>
                      {contest.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{contest.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-sm">
                  <div className="text-gray-500">Start Time</div>
                  <div className="font-medium">{formatDateTime(contest.start_time)}</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500">Duration</div>
                  <div className="font-medium">{contest.duration} minutes</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500">Participants</div>
                  <div className="font-medium">
                    {contest.participants}
                    {contest.max_participants && ` / ${contest.max_participants}`}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500">Problems</div>
                  <div className="font-medium">{contest.problems}</div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${getDifficultyColor(contest.difficulty)}
                  `}>
                    {contest.difficulty}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    Prize: {contest.prize_pool}
                  </span>
                </div>
                
                {contest.status === 'upcoming' && (
                  <div className="text-sm text-gray-600">
                    Starts in: <span className="font-medium">{getTimeUntilStart(contest.start_time)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  {contest.registered && (
                    <span className="flex items-center text-green-600 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Registered
                    </span>
                  )}
                </div>

                <div className="flex space-x-2">
                  {contest.status === 'upcoming' && (
                    <>
                      {!contest.registered ? (
                        <button
                          onClick={() => registerForContest(contest.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Register
                        </button>
                      ) : (
                        <button
                          onClick={() => unregisterFromContest(contest.id)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Unregister
                        </button>
                      )}
                    </>
                  )}
                  
                  {contest.status === 'live' && contest.registered && (
                    <button
                      onClick={() => joinContest(contest.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Join Contest
                    </button>
                  )}
                  
                  {contest.status === 'completed' && (
                    <button
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      View Results
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredContests.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No contests found</h3>
            <p className="mt-1 text-sm text-gray-500">Check back later for new contests.</p>
          </div>
        )}

        {/* Contest Tips */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contest Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Before the Contest</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Practice similar problems</li>
                <li>• Set up your development environment</li>
                <li>• Read contest rules carefully</li>
                <li>• Plan your time allocation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">During the Contest</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Read all problems first</li>
                <li>• Start with easier problems</li>
                <li>• Test your solutions thoroughly</li>
                <li>• Manage your time wisely</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">After the Contest</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Review editorial solutions</li>
                <li>• Learn from your mistakes</li>
                <li>• Practice weak areas</li>
                <li>• Participate regularly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contest;