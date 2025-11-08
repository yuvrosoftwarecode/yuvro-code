# Sample Course Data

This directory contains sample data for development and testing of the learning management system.

## Available Data

### Courses
1. **Data Structures and Algorithms Fundamentals** (DS101) - Category: Fundamentals
2. **Python Programming Complete Course** (PY101) - Category: Programming Languages

### Content Structure
Each course includes:
- **Topics**: Major sections within each course
- **Subtopics**: Detailed content within topics
- **Videos**: Video content associated with subtopics
- **Coding Problems**: Programming exercises with test cases
- **Quizzes**: Multiple choice questions with index-based correct answers

## Loading Sample Data

### Using Management Command (Recommended)
```bash
# Load sample data
python manage.py load_sample_courses

# Clear existing data and load fresh sample data
python manage.py load_sample_courses --clear
```

### Using Django Fixtures (Not Recommended)
The JSON fixture file is provided for reference, but the management command is preferred because:
- It handles auto-generated timestamps correctly
- It's more maintainable and readable
- It provides better error handling and feedback

```bash
# Only use if you need the exact UUIDs from the fixture
python manage.py loaddata fixtures/sample_courses.json
```

## Data Summary

After loading, you'll have:
- 2 Courses (Data Structures & Python)
- 4 Topics (2 per course)
- 8 Subtopics (2 per topic)
- 3 Videos (sample video content)
- 2 Coding Problems (Two Sum, FizzBuzz)
- 5 Quizzes (knowledge assessment questions with index-based answers)

## Course Structure

### Data Structures Course (DS101)
```
Introduction to Data Structures
├── What are Data Structures?
│   ├── Video: Introduction to Data Structures - Complete Overview
│   └── Quiz: What is the main purpose of data structures?
└── Time and Space Complexity
    ├── Video: Big O Notation Explained
    └── Quiz: What does O(n) represent in Big O notation?

Linear Data Structures
├── Arrays and Lists
│   └── Coding Problem: Two Sum Problem
└── Stacks and Queues
```

### Python Course (PY101)
```
Python Basics
├── Python Syntax and Variables
│   ├── Video: Python Variables and Data Types
│   ├── Coding Problem: FizzBuzz
│   └── Quiz: Which is NOT a valid Python variable name?
└── Control Flow and Loops

Object-Oriented Programming
├── Classes and Objects
└── Inheritance and Polymorphism
```

## Development Usage

This sample data is perfect for:
- Testing API endpoints
- Frontend development
- Demonstrating course navigation
- Testing content relationships
- Validating search functionality
- Performance testing with realistic data

## Extending the Data

To add more sample data, modify the `load_sample_courses.py` management command or create additional fixture files.