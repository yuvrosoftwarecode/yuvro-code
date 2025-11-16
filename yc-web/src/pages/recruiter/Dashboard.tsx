import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Active Job Postings',
      value: '8',
      change: '+2 this week',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
        </svg>
      ),
    },
    {
      name: 'Applications Received',
      value: '156',
      change: '+12 today',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Interviews Scheduled',
      value: '24',
      change: '+5 this week',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h6m-6 0l-.5 8.5A2 2 0 0013.5 21h-3A2 2 0 018.5 15.5L8 7z" />
        </svg>
      ),
    },
    {
      name: 'Successful Hires',
      value: '12',
      change: '+3 this month',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const recentApplications = [
    {
      id: 1,
      candidate: 'Priya Sharma',
      position: 'Senior Full Stack Developer',
      status: 'Interview Scheduled',
      appliedDate: '2024-11-14',
    },
    {
      id: 2,
      candidate: 'Rahul Kumar',
      position: 'Python Data Scientist',
      status: 'Under Review',
      appliedDate: '2024-11-13',
    },
    {
      id: 3,
      candidate: 'Anita Patel',
      position: 'DevOps Engineer',
      status: 'Shortlisted',
      appliedDate: '2024-11-12',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-purple-600 rounded-lg p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.username || 'Recruiter'}! 👋
            </h1>
            <p className="text-purple-100 text-lg">
              Here's your recruitment dashboard overview.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-purple-600">{stat.icon}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm font-medium text-green-600">
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentApplications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {application.candidate}
                        </p>
                        <p className="text-sm text-gray-600">{application.position}</p>
                        <p className="text-xs text-gray-500">Applied: {application.appliedDate}</p>
                      </div>
                      <div className="ml-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          application.status === 'Interview Scheduled' 
                            ? 'bg-blue-100 text-blue-800'
                            : application.status === 'Shortlisted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {application.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button className="w-full bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-lg text-left flex items-center">
                    <div className="text-xl mr-3">📝</div>
                    <div className="text-sm font-medium">Post New Job</div>
                  </button>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg text-left flex items-center">
                    <div className="text-xl mr-3">👥</div>
                    <div className="text-sm font-medium">View Candidates</div>
                  </button>
                  <button className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg text-left flex items-center">
                    <div className="text-xl mr-3">📅</div>
                    <div className="text-sm font-medium">Schedule Interview</div>
                  </button>
                  <button className="w-full bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg text-left flex items-center">
                    <div className="text-xl mr-3">📊</div>
                    <div className="text-sm font-medium">View Reports</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Profile Summary</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {(user?.username || user?.email || 'R').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{user?.username || 'Recruiter'}</h4>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-sm text-purple-600">Recruiter</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Jobs</span>
                    <span className="text-sm font-medium text-gray-900">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This Month Hires</span>
                    <span className="text-sm font-medium text-gray-900">3</span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium">
                      View Full Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;