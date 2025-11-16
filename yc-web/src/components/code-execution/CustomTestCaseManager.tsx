import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface CustomTestCase {
  id: string;
  input_data: string;
  expected_output: string;
  description?: string;
}

interface CustomTestCaseManagerProps {
  customTestCases: CustomTestCase[];
  onTestCasesChange: (testCases: CustomTestCase[]) => void;
}

const CustomTestCaseManager: React.FC<CustomTestCaseManagerProps> = ({
  customTestCases,
  onTestCasesChange
}) => {
  const [isAddingTestCase, setIsAddingTestCase] = useState(false);
  const [newTestCase, setNewTestCase] = useState<Omit<CustomTestCase, 'id'>>({
    input_data: '',
    expected_output: '',
    description: ''
  });

  const addTestCase = () => {
    if (!newTestCase.input_data.trim() || !newTestCase.expected_output.trim()) {
      return;
    }

    const testCase: CustomTestCase = {
      id: `custom-${Date.now()}`,
      ...newTestCase
    };

    onTestCasesChange([...customTestCases, testCase]);
    setNewTestCase({ input_data: '', expected_output: '', description: '' });
    setIsAddingTestCase(false);
  };

  const removeTestCase = (id: string) => {
    onTestCasesChange(customTestCases.filter(tc => tc.id !== id));
  };

  const updateTestCase = (id: string, updates: Partial<CustomTestCase>) => {
    onTestCasesChange(
      customTestCases.map(tc => 
        tc.id === id ? { ...tc, ...updates } : tc
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Custom Test Cases</h4>
        <Button
          onClick={() => setIsAddingTestCase(true)}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Test Case
        </Button>
      </div>

      {customTestCases.length === 0 && !isAddingTestCase && (
        <div className="text-center text-gray-500 py-8">
          <div className="mb-4">
            <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-sm">No custom test cases yet</p>
          <p className="text-xs text-gray-400">Add test cases to verify your code works correctly</p>
        </div>
      )}

      {/* Existing Test Cases */}
      {customTestCases.map((testCase, index) => (
        <div key={testCase.id} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium">Test Case {index + 1}</h5>
            <Button
              onClick={() => removeTestCase(testCase.id)}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Input</Label>
              <Textarea
                value={testCase.input_data}
                onChange={(e) => updateTestCase(testCase.id, { input_data: e.target.value })}
                placeholder="Enter input data..."
                className="mt-1 font-mono text-sm"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Expected Output</Label>
              <Textarea
                value={testCase.expected_output}
                onChange={(e) => updateTestCase(testCase.id, { expected_output: e.target.value })}
                placeholder="Enter expected output..."
                className="mt-1 font-mono text-sm"
                rows={3}
              />
            </div>
          </div>

          {testCase.description && (
            <div className="mt-3">
              <Label className="text-sm font-medium text-gray-700">Description</Label>
              <Input
                value={testCase.description}
                onChange={(e) => updateTestCase(testCase.id, { description: e.target.value })}
                placeholder="Optional description..."
                className="mt-1"
              />
            </div>
          )}
        </div>
      ))}

      {/* Add New Test Case Form */}
      {isAddingTestCase && (
        <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
          <h5 className="font-medium mb-3">Add New Test Case</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Input</Label>
              <Textarea
                value={newTestCase.input_data}
                onChange={(e) => setNewTestCase({ ...newTestCase, input_data: e.target.value })}
                placeholder="Enter input data..."
                className="mt-1 font-mono text-sm"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Expected Output</Label>
              <Textarea
                value={newTestCase.expected_output}
                onChange={(e) => setNewTestCase({ ...newTestCase, expected_output: e.target.value })}
                placeholder="Enter expected output..."
                className="mt-1 font-mono text-sm"
                rows={3}
              />
            </div>
          </div>

          <div className="mb-4">
            <Label className="text-sm font-medium text-gray-700">Description (Optional)</Label>
            <Input
              value={newTestCase.description}
              onChange={(e) => setNewTestCase({ ...newTestCase, description: e.target.value })}
              placeholder="Brief description of this test case..."
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={addTestCase}
              size="sm"
              disabled={!newTestCase.input_data.trim() || !newTestCase.expected_output.trim()}
            >
              Add Test Case
            </Button>
            <Button
              onClick={() => {
                setIsAddingTestCase(false);
                setNewTestCase({ input_data: '', expected_output: '', description: '' });
              }}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTestCaseManager;