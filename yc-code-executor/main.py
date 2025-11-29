from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import subprocess
import tempfile
import os
import time
import psutil
import difflib
import asyncio
import json
from observability import setup_telemetry, instrument_fastapi_app, get_tracer, record_code_execution

# Initialize OpenTelemetry
setup_telemetry()

app = FastAPI(title="Code Executor Service", version="1.0.0")

# Instrument FastAPI app for tracing
instrument_fastapi_app(app)

# Get tracer for custom spans
tracer = get_tracer(__name__)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Pydantic models
class CodeExecutionRequest(BaseModel):
    code: str
    language: str
    input_data: str = ""
    timeout: int = 10

class TestCase(BaseModel):
    input_data: str
    expected_output: str
    weight: int = 1

class CodeExecutionWithTestsRequest(BaseModel):
    code: str
    language: str
    test_cases: List[TestCase]
    timeout: int = 10

class ExecutionResult(BaseModel):
    success: bool
    output: str
    error: str
    execution_time: float
    memory_usage: float
    status: str

class TestResult(BaseModel):
    passed: bool
    expected: str
    actual: str
    error: str
    execution_time: float

class CodeExecutionResponse(BaseModel):
    execution_result: ExecutionResult
    test_results: List[TestResult]
    total_passed: int
    total_tests: int
    plagiarism_score: float = 0.0

class PlagiarismCheckRequest(BaseModel):
    code1: str
    code2: str
    language: str

class PlagiarismResult(BaseModel):
    similarity_score: float
    flagged: bool

# Language configurations
LANGUAGE_CONFIGS = {
    'python': {
        'extension': '.py',
        'command': ['python3'],
        'timeout': 10
    },
    'javascript': {
        'extension': '.js',
        'command': ['node'],
        'timeout': 10
    },
    'java': {
        'extension': '.java',
        'compile_command': ['javac', '-cp', '.'],
        'run_command': ['java', '-cp', '.'],
        'timeout': 15
    },
    'cpp': {
        'extension': '.cpp',
        'compile_command': ['g++', '-o'],
        'timeout': 15
    },
    'c': {
        'extension': '.c',
        'compile_command': ['gcc', '-o'],
        'timeout': 15
    }
}

class CodeExecutorService:
    @staticmethod
    async def execute_code(code: str, language: str, input_data: str = "", timeout: int = 10) -> Dict[str, Any]:
        """Execute code and return results"""
        with tracer.start_as_current_span(
            f"execute_code_{language}",
            attributes={
                "code.language": language,
                "code.length": len(code),
                "input.length": len(input_data),
                "timeout": timeout
            }
        ) as span:
            start_time = time.time()
            
            if language not in LANGUAGE_CONFIGS:
                result = {
                    'success': False,
                    'error': f'Unsupported language: {language}',
                    'output': '',
                    'execution_time': 0,
                    'memory_usage': 0,
                    'status': 'error'
                }
                record_code_execution(language, 'error', 0)
                return result

        config = LANGUAGE_CONFIGS[language]
        
        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                # Create source file
                if language == 'java':
                    filename = f"Solution{config['extension']}"
                else:
                    filename = f"solution{config['extension']}"
                    
                filepath = os.path.join(temp_dir, filename)
                
                with open(filepath, 'w') as f:
                    f.write(code)

                # Prepare and execute command
                start_time = time.time()
                
                if language == 'java':
                    # Compile Java
                    compile_cmd = config['compile_command'] + [filename]
                    compile_process = await asyncio.create_subprocess_exec(
                        *compile_cmd,
                        cwd=temp_dir,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                    compile_stdout, compile_stderr = await asyncio.wait_for(
                        compile_process.communicate(), timeout=timeout
                    )
                    
                    if compile_process.returncode != 0:
                        return {
                            'success': False,
                            'error': compile_stderr.decode(),
                            'output': '',
                            'execution_time': time.time() - start_time,
                            'memory_usage': 0,
                            'status': 'compilation_error'
                        }
                    
                    # Run Java
                    run_cmd = config['run_command'] + ['Solution']
                    process = await asyncio.create_subprocess_exec(
                        *run_cmd,
                        cwd=temp_dir,
                        stdin=asyncio.subprocess.PIPE,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                elif language in ['cpp', 'c']:
                    # Compile C/C++
                    output_file = os.path.join(temp_dir, 'solution')
                    compile_cmd = config['compile_command'] + [output_file, filename]
                    compile_process = await asyncio.create_subprocess_exec(
                        *compile_cmd,
                        cwd=temp_dir,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                    compile_stdout, compile_stderr = await asyncio.wait_for(
                        compile_process.communicate(), timeout=timeout
                    )
                    
                    if compile_process.returncode != 0:
                        return {
                            'success': False,
                            'error': compile_stderr.decode(),
                            'output': '',
                            'execution_time': time.time() - start_time,
                            'memory_usage': 0,
                            'status': 'compilation_error'
                        }
                    
                    # Run compiled binary
                    process = await asyncio.create_subprocess_exec(
                        output_file,
                        cwd=temp_dir,
                        stdin=asyncio.subprocess.PIPE,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                else:
                    # Direct execution for Python/JavaScript
                    cmd = config['command'] + [filename]
                    process = await asyncio.create_subprocess_exec(
                        *cmd,
                        cwd=temp_dir,
                        stdin=asyncio.subprocess.PIPE,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )

                # Execute with timeout
                try:
                    stdout, stderr = await asyncio.wait_for(
                        process.communicate(input=input_data.encode()),
                        timeout=timeout
                    )
                    
                    execution_time = time.time() - start_time
                    
                    # Get memory usage (approximate)
                    memory_usage = 0
                    try:
                        if process.pid:
                            ps_process = psutil.Process(process.pid)
                            memory_info = ps_process.memory_info()
                            memory_usage = memory_info.rss / 1024 / 1024  # MB
                    except:
                        pass
                    
                    if process.returncode == 0:
                        result = {
                            'success': True,
                            'output': stdout.decode().strip(),
                            'error': stderr.decode().strip(),
                            'execution_time': execution_time,
                            'memory_usage': memory_usage,
                            'status': 'completed'
                        }
                        span.set_attribute("execution.success", True)
                        span.set_attribute("execution.time", execution_time)
                        span.set_attribute("execution.memory_mb", memory_usage)
                        record_code_execution(language, 'success', execution_time, int(memory_usage * 1024 * 1024))
                        return result
                    else:
                        result = {
                            'success': False,
                            'output': stdout.decode().strip(),
                            'error': stderr.decode().strip(),
                            'execution_time': execution_time,
                            'memory_usage': memory_usage,
                            'status': 'runtime_error'
                        }
                        span.set_attribute("execution.success", False)
                        span.set_attribute("execution.error", stderr.decode().strip())
                        record_code_execution(language, 'runtime_error', execution_time)
                        return result

                except asyncio.TimeoutError:
                    process.kill()
                    result = {
                        'success': False,
                        'error': f'Code execution timed out after {timeout} seconds',
                        'output': '',
                        'execution_time': timeout,
                        'memory_usage': 0,
                        'status': 'timeout'
                    }
                    span.set_attribute("execution.success", False)
                    span.set_attribute("execution.timeout", True)
                    record_code_execution(language, 'timeout', timeout)
                    return result

            except Exception as e:
                result = {
                    'success': False,
                    'error': str(e),
                    'output': '',
                    'execution_time': time.time() - start_time,
                    'memory_usage': 0,
                    'status': 'error'
                }
                span.set_attribute("execution.success", False)
                span.set_attribute("execution.error", str(e))
                record_code_execution(language, 'error', time.time() - start_time)
                return result

    @staticmethod
    def calculate_similarity(code1: str, code2: str) -> float:
        """Calculate similarity between two code snippets"""
        # Normalize code
        normalized_code1 = CodeExecutorService._normalize_code(code1)
        normalized_code2 = CodeExecutorService._normalize_code(code2)
        
        # Use SequenceMatcher for similarity
        matcher = difflib.SequenceMatcher(None, normalized_code1, normalized_code2)
        return matcher.ratio()

    @staticmethod
    def _normalize_code(code: str) -> str:
        """Normalize code for plagiarism detection"""
        lines = []
        for line in code.split('\n'):
            # Remove comments
            if '//' in line:
                line = line[:line.index('//')]
            if '#' in line and not line.strip().startswith('#'):
                line = line[:line.index('#')]
            
            # Remove extra whitespace
            line = ' '.join(line.split())
            if line:
                lines.append(line)
        
        return '\n'.join(lines)

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Code Executor Service", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "code-executor"}

@app.post("/execute", response_model=ExecutionResult)
async def execute_code(request: CodeExecutionRequest):
    """Execute code and return results"""
    try:
        result = await CodeExecutorService.execute_code(
            request.code,
            request.language,
            request.input_data,
            request.timeout
        )
        return ExecutionResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/execute-with-tests", response_model=CodeExecutionResponse)
async def execute_code_with_tests(request: CodeExecutionWithTestsRequest):
    """Execute code and run test cases"""
    try:
        # Validate that test cases are provided
        if not request.test_cases or len(request.test_cases) == 0:
            raise HTTPException(
                status_code=400, 
                detail="No test cases provided. At least one test case is required."
            )
        # First execute the code without input to check for basic errors
        basic_result = await CodeExecutorService.execute_code(
            request.code,
            request.language,
            "",
            request.timeout
        )
        
        test_results = []
        passed_count = 0
        
        # Run each test case
        for test_case in request.test_cases:
            test_result = await CodeExecutorService.execute_code(
                request.code,
                request.language,
                test_case.input_data,
                request.timeout
            )
            
            if test_result['success']:
                actual_output = test_result['output'].strip()
                expected_output = test_case.expected_output.strip()
                passed = actual_output == expected_output
                
                if passed:
                    passed_count += 1
                
                test_results.append(TestResult(
                    passed=passed,
                    expected=expected_output,
                    actual=actual_output,
                    error=test_result.get('error', ''),
                    execution_time=test_result['execution_time']
                ))
            else:
                test_results.append(TestResult(
                    passed=False,
                    expected=test_case.expected_output,
                    actual='',
                    error=test_result['error'],
                    execution_time=test_result['execution_time']
                ))
        
        return CodeExecutionResponse(
            execution_result=ExecutionResult(**basic_result),
            test_results=test_results,
            total_passed=passed_count,
            total_tests=len(request.test_cases),
            plagiarism_score=0.0
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/plagiarism-check", response_model=PlagiarismResult)
async def check_plagiarism(request: PlagiarismCheckRequest):
    """Check plagiarism between two code snippets"""
    try:
        similarity_score = CodeExecutorService.calculate_similarity(
            request.code1,
            request.code2
        )
        
        return PlagiarismResult(
            similarity_score=similarity_score,
            flagged=similarity_score > 0.7
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported programming languages"""
    return {
        "languages": list(LANGUAGE_CONFIGS.keys()),
        "details": {
            lang: {
                "extension": config["extension"],
                "timeout": config["timeout"]
            }
            for lang, config in LANGUAGE_CONFIGS.items()
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)