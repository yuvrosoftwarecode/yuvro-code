import asyncio
import tempfile
import os
import time
import json
import hashlib
import random
from typing import Dict, List, Any
from pydantic import BaseModel
from models import CodeExecutionRequest, TestCase
from config import LANGUAGE_CONFIGS, PYTHON_DRIVER_CODE
from services.plagiarism_detector import PlagiarismService


class CodeExecutionService:
    
    @staticmethod
    def _mask_data_partially(data: str, mask_id: str) -> str:
        """Randomly mask parts of the data, not the entire content"""
        if not data or len(data) < 4:
            return f"***#{mask_id}"
        
        # For short strings, mask middle part
        if len(data) <= 10:
            start = data[:2]
            end = data[-1:]
            return f"{start}***#{mask_id[-4:]}{end}"
        
        # For longer strings, randomly mask 30-50% of characters
        chars = list(data)
        mask_ratio = random.uniform(0.3, 0.5)
        num_to_mask = int(len(chars) * mask_ratio)
        
        # Always keep first and last characters visible
        maskable_indices = list(range(1, len(chars) - 1))
        random.shuffle(maskable_indices)
        
        hash_suffix = hashlib.md5(data.encode()).hexdigest()[:4]
        
        for i in maskable_indices[:num_to_mask]:
            chars[i] = '*'
        
        return ''.join(chars) + f"#{hash_suffix}"
    
    @staticmethod
    def _create_error_test_result(test_case: TestCase, index: int, category: str) -> dict:
        if category == "custom":
            return {
                "input": "***#hidden",
                "expected_output": "***#hidden",
                "actual_output": "***#hidden",
                "status": "failed",
                "runtime_ms": 0,
                "peak_memory_kb": 480,
                "scoring": "ignored"
            }
        elif category == "advanced":
            return {
                "input": CodeExecutionService._mask_data_partially(test_case.input, f"adv_input_{index}"),
                "expected_output": CodeExecutionService._mask_data_partially(test_case.expected_output, f"adv_exp_{index}"),
                "actual_output": "",
                "status": "failed",
                "runtime_ms": 0,
                "memory_kb": 640
            }
        else:  # basic
            return {
                "input": test_case.input,
                "expected_output": test_case.expected_output,
                "actual_output": "",
                "status": "failed",
                "runtime_ms": 0,
                "memory_kb": 512
            }

    @staticmethod
    async def _execute_test_category(test_cases: List[TestCase], temp_dir: str, config: dict, language: str, timeout: int, category: str):
        results = []
        passed_count = 0
        total_runtime_ms = 0
        peak_memory_kb = 512 if category == "basic" else (640 if category == "advanced" else 480)
        
        for i, test_case in enumerate(test_cases):
            input_data = test_case.input
            if language in ['cpp', 'c', 'java']:
                try:
                    processed_lines = []
                    for line in input_data.split('\n'):
                        line = line.strip()
                        if not line: continue
                        try:
                            data = json.loads(line)
                            if isinstance(data, list):
                                processed_lines.append(str(len(data)))
                                processed_lines.append(" ".join(map(str, data)))
                            else:
                                processed_lines.append(str(data))
                        except:
                            if line.startswith('[') and line.endswith(']'):
                                content = line[1:-1].replace(',', ' ')
                                parts = content.split()
                                if parts:
                                    processed_lines.append(str(len(parts)))
                                    processed_lines.append(" ".join(parts))
                                else:
                                    processed_lines.append(line)
                            else:
                                processed_lines.append(line)
                    if processed_lines:
                        input_data = "\n".join(processed_lines)
                except:
                    pass

            start_time = time.time()
            if language == 'java':
                run_cmd = config['run_command'] + ['Solution']
            elif language in ['cpp', 'c']:
                run_cmd = [os.path.join(temp_dir, 'solution')]
            else:
                filename = f"solution{config['extension']}"
                run_cmd = config['command'] + [filename]

            process = await asyncio.create_subprocess_exec(
                *run_cmd,
                cwd=temp_dir,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            try:
                if input_data and not input_data.endswith('\n'):
                    input_data = input_data + '\n'
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(input=input_data.encode()),
                    timeout=timeout
                )
                execution_time = time.time() - start_time
                runtime_ms = int(execution_time * 1000)
                total_runtime_ms += runtime_ms

                actual_output = stdout.decode().strip()
                expected_output = test_case.expected_output.strip()
                
                passed = actual_output == expected_output
                if passed: 
                    passed_count += 1
                
                if category == "custom":
                    result = {
                        "input": "***#hidden",
                        "expected_output": "***#hidden",
                        "actual_output": "***#hidden",
                        "status": "passed" if passed else "failed",
                        "runtime_ms": runtime_ms,
                        "peak_memory_kb": peak_memory_kb + (i * 10),
                        "scoring": "ignored"
                    }
                elif category == "advanced":
                    result = {
                        "input": CodeExecutionService._mask_data_partially(test_case.input, f"adv_input_{i}"),
                        "expected_output": CodeExecutionService._mask_data_partially(test_case.expected_output, f"adv_exp_{i}"),
                        "actual_output": CodeExecutionService._mask_data_partially(actual_output, f"adv_act_{i}"),
                        "status": "passed" if passed else "failed",
                        "runtime_ms": runtime_ms,
                        "memory_kb": peak_memory_kb + (i * 10)
                    }
                else:  # basic
                    result = {
                        "input": test_case.input,
                        "expected_output": test_case.expected_output,
                        "actual_output": actual_output,
                        "status": "passed" if passed else "failed",
                        "runtime_ms": runtime_ms,
                        "memory_kb": peak_memory_kb + (i * 10)
                    }
                
                results.append(result)
                
            except asyncio.TimeoutError:
                try: 
                    process.kill()
                except: 
                    pass
                
                runtime_ms = timeout * 1000
                total_runtime_ms += runtime_ms
                
                if category == "custom":
                    result = {
                        "input": "***#hidden",
                        "expected_output": "***#hidden",
                        "actual_output": "***#hidden",
                        "status": "failed",
                        "runtime_ms": runtime_ms,
                        "peak_memory_kb": peak_memory_kb + (i * 10),
                        "scoring": "ignored"
                    }
                elif category == "advanced":
                    result = {
                        "input": CodeExecutionService._mask_data_partially(test_case.input, f"adv_input_{i}"),
                        "expected_output": CodeExecutionService._mask_data_partially(test_case.expected_output, f"adv_exp_{i}"),
                        "actual_output": "",
                        "status": "failed",
                        "runtime_ms": runtime_ms,
                        "memory_kb": peak_memory_kb + (i * 10)
                    }
                else:  # basic
                    result = {
                        "input": test_case.input,
                        "expected_output": test_case.expected_output,
                        "actual_output": "",
                        "status": "failed",
                        "runtime_ms": runtime_ms,
                        "memory_kb": peak_memory_kb + (i * 10)
                    }
                
                results.append(result)
        
        return results, passed_count, total_runtime_ms, peak_memory_kb

class CodeExecutionHandler:
    
    async def execute_with_plagiarism_check(self, request: CodeExecutionRequest) -> Dict:
        basic_tests = request.test_cases_basic or []
        advanced_tests = request.test_cases_advanced or []
        custom_tests = request.test_cases_custom or []
        
        language = request.language
        config = LANGUAGE_CONFIGS[language]
        
        with tempfile.TemporaryDirectory() as temp_dir:
            if language == 'java':
                filename = "Solution.java"
            else:
                filename = f"solution{config['extension']}"
            
            filepath = os.path.join(temp_dir, filename)
            with open(filepath, 'w') as f:
                f.write(request.code)
                if language == 'python':
                    f.write(PYTHON_DRIVER_CODE)

            is_compiled = 'compile_command' in config
            if is_compiled:
                compile_result = await self._compile_code(temp_dir, config, language, filename, request.timeout)
                if compile_result is not None:
                    plagiarism_report = await self._run_plagiarism_check(request)
                    return self._create_error_response(
                        request, basic_tests, advanced_tests, custom_tests, 
                        plagiarism_report, compile_result
                    )

            basic_results, advanced_results, custom_results, totals = await self._execute_all_test_categories(
                basic_tests, advanced_tests, custom_tests, temp_dir, config, language, request.timeout
            )
            
            score_percent = self._calculate_score_percent(
                basic_tests, advanced_tests, custom_tests,
                basic_results, advanced_results, custom_results
            )
            
            plagiarism_report = await self._run_plagiarism_check(request)
            
            status = "success" if totals['passed'] == totals['total'] else "failed"
            
            return {
                "status": status,
                "language": request.language,
                "test_cases_basic": basic_results,
                "test_cases_advanced": advanced_results,
                "test_cases_custom": custom_results,
                "execution_summary": {
                    "runtime_ms": totals['runtime'],
                    "peak_memory_kb": totals['memory'],
                    "passed_test_cases": totals['passed'],
                    "total_test_cases": totals['total'],
                    "score_percent": round(score_percent, 2)
                },
                "plagiarism_report": plagiarism_report
            }

    async def _compile_code(self, temp_dir: str, config: Dict, language: str, filename: str, timeout: int):
        if language == 'java':
            compile_cmd = config['compile_command'] + [filename]
        elif language in ['cpp', 'c']:
            output_file = os.path.join(temp_dir, 'solution')
            compile_cmd = config['compile_command'] + [output_file, filename]
        
        compile_process = await asyncio.create_subprocess_exec(
            *compile_cmd,
            cwd=temp_dir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(compile_process.communicate(), timeout=timeout)
        
        if compile_process.returncode != 0:
            return stderr.decode()
        return None

    async def _execute_all_test_categories(self, basic_tests, advanced_tests, custom_tests, temp_dir, config, language, timeout):
        basic_results = []
        advanced_results = []
        custom_results = []
        
        # Only count basic and advanced tests for pass/fail determination
        total_passed = 0
        total_tests = 0
        total_runtime_ms = 0
        peak_memory_kb = 0
        
        if basic_tests:
            basic_results, basic_passed, basic_runtime, basic_memory = await CodeExecutionService._execute_test_category(
                basic_tests, temp_dir, config, language, timeout, "basic"
            )
            total_passed += basic_passed
            total_tests += len(basic_tests)
            total_runtime_ms += basic_runtime
            peak_memory_kb = max(peak_memory_kb, basic_memory)
        
        if advanced_tests:
            advanced_results, advanced_passed, advanced_runtime, advanced_memory = await CodeExecutionService._execute_test_category(
                advanced_tests, temp_dir, config, language, timeout, "advanced"
            )
            total_passed += advanced_passed
            total_tests += len(advanced_tests)
            total_runtime_ms += advanced_runtime
            peak_memory_kb = max(peak_memory_kb, advanced_memory)
        
        if custom_tests:
            custom_results, custom_passed, custom_runtime, custom_memory = await CodeExecutionService._execute_test_category(
                custom_tests, temp_dir, config, language, timeout, "custom"
            )
            # Custom tests don't count towards pass/fail or total count
            total_runtime_ms += custom_runtime
            peak_memory_kb = max(peak_memory_kb, custom_memory)
        
        return basic_results, advanced_results, custom_results, {
            'passed': total_passed,
            'total': total_tests,  # Only basic + advanced tests
            'runtime': total_runtime_ms,
            'memory': peak_memory_kb
        }

    def _calculate_score_percent(self, basic_tests, advanced_tests, custom_tests, basic_results, advanced_results, custom_results):
        # Custom tests are never considered for scoring
        total_weight = sum([tc.weight for tc in basic_tests + advanced_tests])
        passed_weight = 0
        
        for i, result in enumerate(basic_results):
            if result.get("status") == "passed":
                passed_weight += basic_tests[i].weight
        for i, result in enumerate(advanced_results):
            if result.get("status") == "passed":
                passed_weight += advanced_tests[i].weight
        # Custom test results are ignored for scoring
        
        return (passed_weight / total_weight * 100) if total_weight > 0 else 0

    async def _run_plagiarism_check(self, request: CodeExecutionRequest):
        if request.peer_submissions and len(request.peer_submissions) > 0:
            return PlagiarismService.calculate_similarity_for_plagiarism(
                request.code, 
                request.peer_submissions
            )
        return {
            "flagged": False,
            "max_similarity": 0.0,
            "matches": []
        }

    def _create_error_response(self, request, basic_tests, advanced_tests, custom_tests, plagiarism_report, error):
        return {
            "status": "error",
            "language": request.language,
            "test_cases_basic": [
                CodeExecutionService._create_error_test_result(tc, i, "basic")
                for i, tc in enumerate(basic_tests)
            ],
            "test_cases_advanced": [
                CodeExecutionService._create_error_test_result(tc, i, "advanced")
                for i, tc in enumerate(advanced_tests)
            ],
            "test_cases_custom": [
                CodeExecutionService._create_error_test_result(tc, i, "custom")
                for i, tc in enumerate(custom_tests)
            ],
            "execution_summary": {
                "runtime_ms": 0,
                "peak_memory_kb": 0,
                "passed_test_cases": 0,
                "total_test_cases": len(basic_tests) + len(advanced_tests),  # Exclude custom tests from total
                "score_percent": 0.0
            },
            "plagiarism_report": plagiarism_report,
            "error": error
        }