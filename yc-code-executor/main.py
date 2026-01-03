from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from observability import setup_telemetry, instrument_fastapi_app
from routers.code_execution import router as code_execution_router

setup_telemetry()

app = FastAPI(title="Code Executor Service", version="1.0.0")

instrument_fastapi_app(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(code_execution_router)

@app.get("/")
async def root():
    return {"message": "Code Executor Service", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "code-executor"}

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Enable reload in development mode
    reload = os.getenv("DEBUG", "false").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0", 
        port=8002,
        reload=reload,
        reload_dirs=["./"] if reload else None
    )