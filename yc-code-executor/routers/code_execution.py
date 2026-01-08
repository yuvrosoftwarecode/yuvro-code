from fastapi import APIRouter, HTTPException
from models import CodeExecutionRequest
from services.code_executer import CodeExecutionHandler
from config import LANGUAGE_CONFIGS, EXAMPLE_PROBLEMS

router = APIRouter()

@router.post("/execute-code-with-plagiarism-checks")
async def execute_code_with_plagiarism_checks(request: CodeExecutionRequest):
    try:
        basic_tests = request.test_cases_basic or []
        advanced_tests = request.test_cases_advanced or []
        custom_tests = request.test_cases_custom or []
        
        if not (basic_tests or advanced_tests or custom_tests):
            raise HTTPException(status_code=400, detail="No test cases provided")

        if request.language not in LANGUAGE_CONFIGS:
            raise HTTPException(status_code=400, detail=f"Unsupported language: {request.language}")

        handler = CodeExecutionHandler()
        result = await handler.execute_with_plagiarism_check(request)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/supported-languages-and-templates")
async def get_supported_languages():
    return {
        "languages": list(LANGUAGE_CONFIGS.keys()),
        "details": {
            lang: {
                "extension": config["extension"],
                "timeout": config["timeout"],
                "template": config.get("template", "")
            }
            for lang, config in LANGUAGE_CONFIGS.items()
        },
        "example_problems": EXAMPLE_PROBLEMS
    }