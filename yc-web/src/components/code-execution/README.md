# Code Execution Components

This directory contains modular, reusable components for code execution across different contexts in the application.

## Components

### `CodeExecutionPanel`
The main component that provides a complete code execution interface.

**Props:**
- `problem?: CodingProblem` - The coding problem to solve
- `initialCode?: string` - Pre-filled code in the editor
- `onSubmissionComplete?: (result: ExecutionResult) => void` - Callback when submission completes
- `showSubmitButton?: boolean` - Whether to show the submit button (default: true)
- `showRunButton?: boolean` - Whether to show the run button (default: true)
- `showTestCases?: boolean` - Whether to show the test cases tab (default: true)
- `mode?: 'practice' | 'exam' | 'learn'` - Execution mode that affects UI behavior
- `className?: string` - Additional CSS classes

### `ExecutionResults`
Component for displaying code execution results with performance metrics.

### `PerformanceMetrics`
Component for showing execution statistics (runtime, memory, score, test cases).

### `TestCaseViewer`
Component for displaying test cases with results.

## Usage Examples

### 1. Practice/Course Context (Default)
```tsx
import { CodeExecutionPanel } from './components/code-execution';

<CodeExecutionPanel
  problem={codingProblem}
  onSubmissionComplete={handleSubmission}
  mode="practice"
/>
```

### 2. Skill Test/Exam Context
```tsx
<CodeExecutionPanel
  problem={examProblem}
  onSubmissionComplete={handleExamSubmission}
  mode="exam"
  showRunButton={false}        // Hide debugging features
  showTestCases={false}        // Hide test cases
  className="border-2 border-orange-200"
/>
```

### 3. Learning/Tutorial Context
```tsx
<CodeExecutionPanel
  problem={learningProblem}
  onSubmissionComplete={handleLearningProgress}
  mode="learn"
  initialCode={tutorialStarterCode}
  className="border-2 border-blue-200"
/>
```

### 4. Quick Challenge Context
```tsx
<CodeExecutionPanel
  problem={quickChallenge}
  mode="practice"
  showSubmitButton={false}     // Only allow running
  className="border border-purple-200"
/>
```

## Mode Differences

### `practice` (default)
- Shows both Run and Submit buttons
- Displays helpful hints and tips
- Shows test cases for debugging
- Full feature set

### `exam`
- Typically hides Run button (configurable)
- Hides test cases to prevent cheating
- Minimal UI hints
- Focused on evaluation

### `learn`
- Shows educational hints and tips
- Encourages experimentation with Run button
- May include starter code
- Progress tracking friendly

## Key Features

### Execution Stats Display
- **Run Code**: Shows detailed test case results for debugging
- **Submit Solution**: Shows only execution statistics (runtime, memory, score) without revealing test case details

### Responsive Design
- Works on desktop and mobile
- Adaptive layout for different screen sizes

### Flexible Configuration
- Each button and feature can be shown/hidden
- Different modes for different contexts
- Customizable styling

## Migration from Old CodeExecutor

The original `CodeExecutor` component now uses `CodeExecutionPanel` internally:

```tsx
// Old usage (still works)
<CodeExecutor 
  codingProblem={problem}
  onSubmissionComplete={handleSubmission}
/>

// New usage (more flexible)
<CodeExecutionPanel
  problem={problem}
  onSubmissionComplete={handleSubmission}
  mode="practice"
/>
```

## File Structure

```
code-execution/
├── CodeExecutionPanel.tsx    # Main component
├── ExecutionResults.tsx      # Results display
├── PerformanceMetrics.tsx    # Execution stats
├── TestCaseViewer.tsx        # Test cases display
├── index.ts                  # Exports
├── examples/                 # Usage examples
│   ├── SkillTestExample.tsx
│   ├── LearnExample.tsx
│   └── QuickChallengeExample.tsx
└── README.md                 # This file
```