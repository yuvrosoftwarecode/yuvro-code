import React from 'react';
import Navigation from '../../components/Navigation';
const CodePractice: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

      <h1 className="text-3xl font-bold mb-4">
        Code Practice (Dummy Page)</h1>
      <p className="text-gray-600 mb-6">
        This is a placeholder for the Code Practice page. Implement practice exercises here.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">Exercise card 1 (placeholder)</div>
        <div className="p-4 border rounded-lg">Exercise card 2 (placeholder)</div>
        <div className="p-4 border rounded-lg">Exercise card 3 (placeholder)</div>
      </div>
    </div>
    </div>
  );
};

export default CodePractice;
