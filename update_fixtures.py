import json
import re

file_path = '/Users/devendradora/projects-other/yuvro-code/yc-backend-api/course/fixtures/sample_courses_data.json'

with open(file_path, 'r') as f:
    data = json.load(f)

def clean_value(val):
    # Remove "var = " pattern
    # This regex looks for simple variable assignments like "var = " at start of line or after comma/newline
    # But some inputs are complex.
    # Pattern: identifier = value
    
    # Heuristic: split by ", " or "\n" if it looks like var assignment
    # But wait, JSON values can contain commas.
    # Most of our bad inputs look like: "nums = [...], target = 9"
    # or "head = [...], pos = 1"
    
    if not isinstance(val, str):
        return val
        
    # Check if it matches key=value pattern
    if '=' not in val:
        return val

    # Split by ", " might be dangerous if list contains ", ".
    # But in the fixtures, the arrays are usually valid JSON arrays.
    
    # Strategy: 
    # 1. Try to split by top-level comma+space that separates assignments. 
    #    Since we don't have a full parser, we can fallback to manual fix if generic approach is hard.
    #    However, manual fix for so many items is tedious.
    
    # Let's try a regex replacer for "identifier = " -> "" and ", identifier = " -> "\n"
    
    # Example: "nums = [1, 2], target = 3" -> "[1, 2]\n3"
    # "head = [1], pos = -1" -> "[1]\n-1"
    
    # Regex: replace `^\s*\w+\s*=\s*` with ``
    # replace `,\s*\w+\s*=\s*` with `\n` (careful about commas inside brackets)
    
    # Better approach for this specific dataset:
    # Most "bad" inputs are clearly strictly formatted like "key = val, key2 = val2".
    
    # Let's look at specific problems.
    
    new_val = val
    
    # Common patterns
    patterns = [
        r'^\s*\w+\s*=\s*', # logical start
        r',\s*\w+\s*=\s*'  # separator
    ]
    
    # We need to be careful not to replace inside strings or arrays strictly speaking, 
    # but looking at the file, the keys are usually outside.
    
    # Special case: "graph = {0: ...}, start = 2"
    # The comma inside {} should be preserved. The comma before "start" should become newline.
    
    # Let's do a rough pass:
    # 1. Replace "variable = " at the start of the string.
    new_val = re.sub(r'^\s*[a-zA-Z0-9_]+\s*=\s*', '', new_val)
    
    # 2. Replace ", variable = " with "\n"
    # To avoid matching inside structures, we might need to be smarter.
    # But maybe we can just target the specific variable names we know appear?
    # known vars: list1, list2, nums, target, head, pos, val, node, s, t, height, k, numCourses, prerequisites, root, graph, start, grid
    
    vars = ['list1', 'list2', 'nums', 'target', 'head', 'pos', 'val', 'node', 's', 't', 'height', 'k', 'numCourses', 'prerequisites', 'root', 'graph', 'start', 'grid']
    
    for v in vars:
        # Regex to find ", v =" or "\n v ="
        # Note: variable name should be matched as a whole word
        pattern = r'(,|,\s|\n)\s*\b' + v + r'\b\s*=\s*'
        new_val = re.sub(pattern, '\n', new_val)
        
    return new_val.strip()

def process_cases(cases):
    if not cases: return
    for case in cases:
        if 'input' in case:
            case['input'] = clean_value(case['input'])
        if 'input_data' in case:
            case['input_data'] = clean_value(case['input_data'])
        # Output usually doesn't have var names, except sometimes in examples
        if 'output' in case:
            case['output'] = clean_value(case['output'])
            # Sometimes output has ", nums = [...]" in examples
            # example: "2, nums = [1,2,_]" -> we probably only want "2" for strict checking, 
            # but for *examples* display, the extra info is useful explanation.
            # However, the user asked for "Competitive Coding Version".
            # In competitive coding, return value is usually singular.
            # "Remove Duplicates": output is k. The array modification is side effect.
            # But the example output text says "2, nums = ...".
            # I will leave output in examples alone if it looks explanatory, 
            # but for test_cases, it must be strict.
            pass

def process_course(course):
    for q in course.get('questions', []):
        if q.get('type') == 'coding':
            process_cases(q.get('test_cases_basic'))
            process_cases(q.get('test_cases_advanced'))
            process_cases(q.get('examples'))

for course in data['courses']:
    process_course(course)

with open(file_path, 'w') as f:
    json.dump(data, f, indent=2)
