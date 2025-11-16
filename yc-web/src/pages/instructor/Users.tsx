import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { debugTokens, clearAllTokens, validateTokenFormat } from '../../utils/tokenDebug';
import Navigation from '../../components/Navigation';

interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'instructor' | 'recruiter' | 'student';
    isActive: boolean;
    lastLogin: string;
    createdAt: string;
}

const Users: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'instructor' | 'recruiter' | 'student'>('all');
    const [showAddUser, setShowAddUser] = useState(false);

    // Sample user data
    const [users] = useState<User[]>([
        {
            id: '1',
            email: 'admin@yuvro.com',
            username: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            isActive: true,
            lastLogin: '2024-11-15T10:30:00Z',
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: '2',
            email: 'instructor_ds@yuvro.com',
            username: 'instructor_ds',
            firstName: 'Data Structures',
            lastName: 'Instructor',
            role: 'instructor',
            isActive: true,
            lastLogin: '2024-11-14T15:45:00Z',
            createdAt: '2024-02-15T00:00:00Z'
        },
        {
            id: '3',
            email: 'recruiter@yuvro.com',
            username: 'recruiter',
            firstName: 'Tech',
            lastName: 'Recruiter',
            role: 'recruiter',
            isActive: true,
            lastLogin: '2024-11-13T09:20:00Z',
            createdAt: '2024-03-01T00:00:00Z'
        },
        {
            id: '4',
            email: 'student1@gmail.com',
            username: 'student1',
            firstName: 'Shilpa',
            lastName: 'Dora',
            role: 'student',
            isActive: true,
            lastLogin: '2024-11-15T08:15:00Z',
            createdAt: '2024-04-10T00:00:00Z'
        }
    ]);

    const filteredUsers = users.filter(u => {
        if (activeTab === 'all') return true;
        return u.role === activeTab;
    });

    const getRoleBadge = (role: string) => {
        const roleStyles = {
            admin: 'bg-red-100 text-red-800',
            instructor: 'bg-blue-100 text-blue-800',
            recruiter: 'bg-purple-100 text-purple-800',
            student: 'bg-green-100 text-green-800'
        };
        return roleStyles[role as keyof typeof roleStyles] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Only admin can access this page
    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                        <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Manage system users and their roles
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddUser(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                + Add New User
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="mb-6">
                    <nav className="flex space-x-8">
                        {[
                            { key: 'all', label: 'All Users', count: users.length },
                            { key: 'admin', label: 'Admins', count: users.filter(u => u.role === 'admin').length },
                            { key: 'instructor', label: 'Instructors', count: users.filter(u => u.role === 'instructor').length },
                            { key: 'recruiter', label: 'Recruiters', count: users.filter(u => u.role === 'recruiter').length },
                            { key: 'student', label: 'Students', count: users.filter(u => u.role === 'student').length }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`rounded-full px-2 py-1 text-xs ${activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Users Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Login
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.firstName} {user.lastName}
                                                </div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(user.lastLogin)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                                            Edit
                                        </button>
                                        <button className="text-red-600 hover:text-red-900">
                                            {user.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {activeTab === 'all' ? 'No users found.' : `No ${activeTab} users found.`}
                        </p>
                    </div>
                )}
            </div>

            {/* Add User Modal (placeholder) */}
            {showAddUser && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                                        <option value="instructor">Instructor</option>
                                        <option value="recruiter">Recruiter</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        onClick={() => setShowAddUser(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                        Add User
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;