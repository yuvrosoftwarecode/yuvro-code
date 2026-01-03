# Language configurations
LANGUAGE_CONFIGS = {
    'python': {
        'extension': '.py',
        'command': ['python3'],
        'timeout': 10,
        'template': """class Solution:
    def solve(self, *args):
        # Competitive Programming Template - Python
        # Each line of your test case input is passed as an argument in *args.
        # Arguments are automatically parsed as JSON/Numbers if possible.

        # Example: If your input lines are: "Hello", 42, [1, 2, 3]
        # You can access them like this:
        # input_str = args[0] if len(args) > 0 else ""
        # num = args[1] if len(args) > 1 else 0
        # list_data = args[2] if len(args) > 2 else []

        # Start your logic below:
        return None
"""
    },
    'javascript': {
        'extension': '.js',
        'command': ['node'],
        'timeout': 10,
        'template': """"use strict";

const fs = require('fs');

/**
 * Competitive Programming Template - Node.js
 * Reads stdin and parses lines. Often inputs are JSON strings.
 */
function solve() {
    const lines = fs.readFileSync(0, 'utf8').split('\\n').filter(line => line.trim());
    if (lines.length === 0) return;

    // Example: parse first line as a JSON array
    try {
        const data = JSON.parse(lines[0]);
        // Your logic here
    } catch (e) {
        // Fallback for non-JSON input
        const data = lines[0];
    }
}

solve();
"""
    },
    'java': {
        'extension': '.java',
        'compile_command': ['javac', '-cp', '.'],
        'run_command': ['java', '-cp', '.'],
        'timeout': 15,
        'template': """import java.util.*;

/**
 * Competitive Programming Template - Java
 */
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        // For array inputs, the platform provides [count] followed by [elements]
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            int[] arr = new int[n];
            for(int i = 0; i < n; i++) {
                arr[i] = sc.nextInt();
            }
            // Your logic here
        }
    }
}
"""
    },
    'cpp': {
        'extension': '.cpp',
        'compile_command': ['g++', '-o'],
        'timeout': 15,
        'template': """#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

/**
 * Competitive Programming Template - C++
 */
int main() {
    // Faster I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    // For array inputs, the platform provides [count] followed by [elements]
    if (cin >> n) {
        vector<int> arr(n);
        for(int i = 0; i < n; i++) {
            cin >> arr[i];
        }
        // Your logic here
    }

    return 0;
}
"""
    },
    'c': {
        'extension': '.c',
        'compile_command': ['gcc', '-o'],
        'timeout': 15,
        'template': """#include <stdio.h>
#include <stdlib.h>

/**
 * Competitive Programming Template - C
 */
int main() {
    int n;
    // For array inputs, the platform provides [count] followed by [elements]
    if (scanf("%d", &n) == 1) {
        int* arr = (int*)malloc(n * sizeof(int));
        for(int i = 0; i < n; i++) {
            scanf("%d", &arr[i]);
        }
        
        // Your logic here
        
        free(arr);
    }
    return 0;
}
"""
    }
}

PYTHON_DRIVER_CODE = """
import sys
import json
import ast
import io
from contextlib import redirect_stdout

def _driver_execution():
    # check if Solution class exists
    if 'Solution' not in globals():
        return

    try:
        sol = globals()['Solution']()
        # Find method
        methods = [m for m in dir(sol) if callable(getattr(sol, m)) and not m.startswith('_')]
        if not methods:
            return
        
        # Use first available method
        method = getattr(sol, methods[0])
        
        # Read input
        input_str = sys.stdin.read().strip()
        if not input_str:
            return
            
        # Parse args
        args = []
        # Support multi-line inputs as separate arguments
        for line in input_str.split('\\n'):
            line = line.strip()
            if not line: continue
            try:
                arg = json.loads(line)
            except:
                try:
                    arg = ast.literal_eval(line)
                except:
                    arg = line
            args.append(arg)
            
        # Capture stdout (print statements) separately from return value
        console_output = io.StringIO()
        with redirect_stdout(console_output):
            result = method(*args)
        
        # Print console output to stderr so we can capture it separately
        console_content = console_output.getvalue()
        if console_content:
            print(console_content, file=sys.stderr, end='')
        
        # Print only the result to stdout
        if result is not None:
            # formatted output
            if isinstance(result, (list, dict, tuple)):
                print(json.dumps(result, separators=(',', ':')))
            elif isinstance(result, bool):
                print('true' if result else 'false')
            else:
                print(result)
                
    except Exception as e:
        print(f"Runtime Error: {str(e)}", file=sys.stderr)

if __name__ == '__main__':
    _driver_execution()
"""

# Example problems with solutions for all languages
EXAMPLE_PROBLEMS = [
    {
        "id": "reverse-string",
        "title": "Reverse a String",
        "description": "Write a function that reverses an input string. The input will be a single string on one line.",
        "test_cases": [
            {"input": "hello", "expected_output": "olleh"},
            {"input": "world", "expected_output": "dlrow"},
            {"input": "OpenAI", "expected_output": "IAnepO"},
        ],
        "solutions": {
            "python": '''class Solution:
    def solve(self, *args):
        input_str = args[0] if len(args) > 0 else ""
        return input_str[::-1]
''',
            "javascript": '''"use strict";
const fs = require('fs');
function solve() {
    const lines = fs.readFileSync(0, 'utf8').split('\\n').filter(l => l.trim());
    if (lines.length === 0) return;
    console.log(lines[0].split('').reverse().join(''));
}
solve();
''',
            "java": '''import java.util.*;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLine()) {
            String s = sc.nextLine();
            System.out.println(new StringBuilder(s).reverse().toString());
        }
    }
}
''',
            "cpp": '''#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    string s;
    if (getline(cin, s)) {
        reverse(s.begin(), s.end());
        cout << s << endl;
    }
    return 0;
}
''',
            "c": '''#include <stdio.h>
#include <string.h>
int main() {
    char s[1000];
    if (fgets(s, sizeof(s), stdin)) {
        s[strcspn(s, "\\n")] = 0;
        int len = strlen(s);
        for(int i = 0; i < len / 2; i++) {
            char t = s[i];
            s[i] = s[len - 1 - i];
            s[len - 1 - i] = t;
        }
        printf("%s\\n", s);
    }
    return 0;
}
'''
        }
    },
    {
        "id": "find-max",
        "title": "Find Maximum in Array",
        "description": "Find the largest element in an array of integers. Input is a JSON array like [1, 3, 7, 2, 5].",
        "test_cases": [
            {"input": "[1, 3, 7, 2, 5]", "expected_output": "7"},
            {"input": "[-1, -5, -2]", "expected_output": "-1"},
            {"input": "[42]", "expected_output": "42"},
        ],
        "solutions": {
            "python": '''class Solution:
    def solve(self, *args):
        arr = args[0] if len(args) > 0 else []
        if not arr: return None
        return max(arr)
''',
            "javascript": '''"use strict";
const fs = require('fs');
function solve() {
    const lines = fs.readFileSync(0, 'utf8').split('\\n').filter(l => l.trim());
    if (lines.length === 0) return;
    const arr = JSON.parse(lines[0]);
    console.log(Math.max(...arr));
}
solve();
''',
            "java": '''import java.util.*;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            int max = Integer.MIN_VALUE;
            for(int i = 0; i < n; i++) {
                int v = sc.nextInt();
                if (v > max) max = v;
            }
            System.out.println(max);
        }
    }
}
''',
            "cpp": '''#include <iostream>
#include <climits>
using namespace std;
int main() {
    int n;
    if (cin >> n) {
        int maxVal = INT_MIN;
        for(int i = 0; i < n; i++) {
            int v; cin >> v;
            if (v > maxVal) maxVal = v;
        }
        cout << maxVal << endl;
    }
    return 0;
}
''',
            "c": '''#include <stdio.h>
#include <limits.h>
int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        int maxVal = INT_MIN;
        for(int i = 0; i < n; i++) {
            int v; scanf("%d", &v);
            if (v > maxVal) maxVal = v;
        }
        printf("%d\\n", maxVal);
    }
    return 0;
}
'''
        }
    }
]