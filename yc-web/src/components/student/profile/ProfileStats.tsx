import React from 'react';
import { Trophy, Target, Code, Award, TrendingUp, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProfileStatsProps {
  profileStrength: number;
  suggestions: { text: string; boost: number }[];
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ profileStrength, suggestions }) => {
  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-600';
    if (strength >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrengthBgColor = (strength: number) => {
    if (strength >= 80) return 'bg-green-500';
    if (strength >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const stats = [
    {
      icon: Code,
      label: 'Problems Solved',
      value: '47',
      change: '+12 this week',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Trophy,
      label: 'Contests Won',
      value: '8',
      change: '+2 this month',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      icon: Target,
      label: 'Tests Passed',
      value: '15',
      change: '+5 this week',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Award,
      label: 'Certifications',
      value: '3',
      change: '+1 this month',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Strength */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
            Profile Strength
          </h2>
          <span className={`text-2xl font-bold ${getStrengthColor(profileStrength)}`}>
            {profileStrength}%
          </span>
        </div>
        
        <div className="mb-4">
          <Progress 
            value={profileStrength} 
            className="h-3"
          />
        </div>

        <div className="text-sm text-gray-600 mb-4">
          {profileStrength >= 80 && "Excellent! Your profile is very strong."}
          {profileStrength >= 60 && profileStrength < 80 && "Good profile! A few improvements can make it even better."}
          {profileStrength < 60 && "Your profile needs some work to stand out to employers."}
        </div>

        {suggestions.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Suggestions to improve:</h3>
            <div className="space-y-2">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{suggestion.text}</span>
                  <span className="text-green-600 font-medium">+{suggestion.boost}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Performance Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className={`${stat.bgColor} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
              </div>
              <div className="text-sm font-medium text-gray-700 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.change}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-indigo-600" />
          Recent Achievements
        </h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Contest Winner</p>
              <p className="text-xs text-gray-500">Won Weekly Challenge #42</p>
            </div>
            <div className="text-xs text-gray-400 ml-auto">2 days ago</div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Skill Master</p>
              <p className="text-xs text-gray-500">Completed React Assessment</p>
            </div>
            <div className="text-xs text-gray-400 ml-auto">1 week ago</div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Code className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Problem Solver</p>
              <p className="text-xs text-gray-500">Solved 50+ problems</p>
            </div>
            <div className="text-xs text-gray-400 ml-auto">2 weeks ago</div>
          </div>
        </div>
      </div>

      {/* Learning Streak */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-indigo-600" />
          Learning Streak
        </h2>
        <div className="text-center">
          <div className="text-4xl font-bold text-indigo-600 mb-2">7</div>
          <div className="text-gray-600 mb-4">Days in a row</div>
          <div className="flex justify-center space-x-1 mb-4">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < 7 ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">Keep it up! You're on fire! 🔥</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileStats;