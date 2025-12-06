import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import codeExecutorService, { 
  PlagiarismReport, 
  CodeSubmission 
} from '../../services/codeExecutorService';

const CodeManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'plagiarism' | 'submissions'>('plagiarism');
  const [plagiarismReports, setPlagiarismReports] = useState<PlagiarismReport[]>([]);
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'instructor') {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'plagiarism':
          const reports = await codeExecutorService.getPlagiarismReports(0.3);
          setPlagiarismReports(reports);
          break;
        case 'submissions':
          const subs = await codeExecutorService.getSubmissions();
          setSubmissions(subs);
          break;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestCase = async () => {
    try {
      await codeExecutorService.createTestCase(newTestCase as Omit<TestCase, 'id'>);
      setShowCreateModal(false);
      setNewTestCase({
        problem_title: '',
        input_data: '',
        expected_output: '',
        is_hidden: false,
        weight: 1
      });
      loadData();
    } catch (error) {
      console.error('Failed to create test case:', error);
    }
  };

  const handleDeleteTestCase = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this test case?')) {
      try {
        await codeExecutorService.deleteTestCase(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete test case:', error);
      }
    }
  };

  if (user?.role !== 'instructor') {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Access denied. Instructor privileges required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'testcases', label: 'Test Cases' },
            { key: 'plagiarism', label: 'Plagiarism Reports' },
            { key: 'submissions', label: 'All Submissions' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      ) : (
        <>
          {/* Test Cases Tab */}
          {activeTab === 'testcases' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Test Cases</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create Test Case
                </button>
              </div>

              <div className="grid gap-4">
                {testCases.map((testCase) => (
                  <div key={testCase.id} className="bg-white p-6 rounded-lg shadow border">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{testCase.problem_title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>Weight: {testCase.weight}</span>
                          {testCase.is_hidden && <span className="text-orange-600">🔒 Hidden</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTestCase(testCase.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Input:</label>
                        <pre className="bg-gray-50 p-3 rounded text-sm border">{testCase.input_data}</pre>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expected Output:</label>
                        <pre className="bg-gray-50 p-3 rounded text-sm border">{testCase.expected_output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plagiarism Reports Tab */}
          {activeTab === 'plagiarism' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Plagiarism Reports</h2>
              <div className="grid gap-4">
                {plagiarismReports.map((report) => (
                  <div key={report.id} className="bg-white p-6 rounded-lg shadow border">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-semibold">
                          {report.submission1_user} vs {report.submission2_user}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${report.similarity_score > 0.7 
                          ? 'bg-red-100 text-red-800' 
                          : report.similarity_score > 0.3 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }
                      `}>
                        {(report.similarity_score * 100).toFixed(1)}% Similar
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">All Submissions</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Problem</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Cases</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plagiarism</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {/* User info would need to be included in the API response */}
                          User #{submission.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {submission.problem_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {submission.language}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`
                            px-2 py-1 text-xs font-medium rounded-full
                            ${submission.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : submission.status === 'error'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          `}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {submission.test_cases_passed} / {submission.total_test_cases}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {submission.plagiarism_score 
                            ? `${(submission.plagiarism_score * 100).toFixed(1)}%`
                            : 'N/A'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Test Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Test Case</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problem Title
                </label>
                <input
                  type="text"
                  value={newTestCase.problem_title}
                  onChange={(e) => setNewTestCase({...newTestCase, problem_title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Input Data
                </label>
                <textarea
                  value={newTestCase.input_data}
                  onChange={(e) => setNewTestCase({...newTestCase, input_data: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Output
                </label>
                <textarea
                  value={newTestCase.expected_output}
                  onChange={(e) => setNewTestCase({...newTestCase, expected_output: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTestCase.is_hidden}
                    onChange={(e) => setNewTestCase({...newTestCase, is_hidden: e.target.checked})}
                    className="mr-2"
                  />
                  Hidden Test Case
                </label>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight
                  </label>
                  <input
                    type="number"
                    value={newTestCase.weight}
                    onChange={(e) => setNewTestCase({...newTestCase, weight: parseInt(e.target.value)})}
                    min="1"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTestCase}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CodeManagement;