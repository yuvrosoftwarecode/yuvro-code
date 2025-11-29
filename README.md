# YC Full-Stack Application

A modern full-stack web application built with Django REST Framework backend, React frontend, PostgreSQL database, and Docker Compose orchestration.

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- Make (usually pre-installed on most systems)

## 🛠️ Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd yuvro-code
   make setup
   ```

2. **Start development environment:**
   ```bash
   make dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001
   - **Code Executor Service**: http://localhost:8002
   - **API Documentation (Swagger)**: http://localhost:8001/api/docs/
   - **API Documentation (ReDoc)**: http://localhost:8001/api/redoc/
   - **Code Executor API Docs**: http://localhost:8002/docs
   - **OpenAPI Schema**: http://localhost:8001/api/schema/

4. **Access observability dashboards:**
   - **Grafana**: http://localhost:3001 (admin/admin)
   - **Jaeger Tracing**: http://localhost:16686
   - **Prometheus**: http://localhost:9090
   - **Loki Logs**: http://localhost:3100

## 📁 Project Structure

```
yuvro-code/
├── yc-backend-api/          # Django REST Framework backend
│   ├── authentication/      # Authentication app
│   ├── code_executor/       # Code execution Django app
│   ├── yc-backend-api/      # Django project settings
│   ├── Dockerfile          # Backend container config
│   └── requirements.txt    # Python dependencies
├── yc-code-executor/        # FastAPI code execution service
│   ├── main.py             # FastAPI application
│   ├── test_service.py     # Service tests
│   ├── Dockerfile          # Service container config
│   └── requirements.txt    # Python dependencies
├── yc-web/                 # React frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── Dockerfile         # Frontend container config
│   └── package.json       # Node.js dependencies
├── yc-observability/      # Monitoring and tracing stack
│   ├── grafana/           # Grafana dashboards and config
│   ├── otel-collector-config.yaml # OpenTelemetry collector config
│   ├── prometheus.yml     # Prometheus configuration
│   ├── setup.sh           # Observability setup script
│   └── README.md          # Observability documentation
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Development orchestration
├── docker-compose.prod.yml # Production orchestration
├── Makefile               # Command shortcuts
└── README.md              # This file
```

## 🔧 Development Commands

### Using Make (Recommended)

```bash
# Show all available commands
make help

# Development
make dev                   # Start all services
make dev-detached          # Start in background
make stop                  # Stop all services
make restart               # Restart services
make logs SERVICE=name     # View logs (optional service name)

# Database operations
make db-makemigrations     # Create migrations
make db-migrate            # Run migrations
make db-createsuperuser    # create super user 
make db-shell              # Access database shell
make db-reset              # Reset database

# Testing
make test-all              # Run all tests
make backend-test          # Backend tests only
make frontend-test         # Frontend tests only

# Code quality
make format-all            # Format all code
make lint-all              # Lint all code
make check-all             # Run all checks

# Individual service commands
make backend-shell         # Django shell
make frontend-shell        # Node.js shell
make executor-shell        # Code executor shell
make executor-test         # Test code executor service
make executor-logs         # View code executor logs

# Package installation
make backend-install PKG=package-name    # Install backend package
make frontend-install PKG=package-name   # Install frontend package
```


## 📚 API Documentation

The API is fully documented using OpenAPI 3.0 specification with interactive documentation available through Swagger UI and ReDoc.

### Documentation URLs

- **Swagger UI**: http://localhost:8001/api/docs/ - Interactive API explorer
- **ReDoc**: http://localhost:8001/api/redoc/ - Clean, responsive documentation
- **OpenAPI Schema**: http://localhost:8001/api/schema/ - Raw OpenAPI 3.0 schema

### Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/token/` - Login (get JWT tokens)
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `POST /api/auth/logout/` - Logout (blacklist token)

#### User Management
- `GET /api/auth/user/` - Get current user profile
- `PUT /api/auth/user/` - Update user profile
- `GET /api/auth/profile/` - Get user profile details

#### Courses
- `GET /api/course/courses/` - List courses
- `POST /api/course/courses/` - Create course
- `GET /api/course/courses/{id}/` - Get course details

#### AI Assistant
- `POST /api/ai/chat/` - Chat with AI assistant
- `GET /api/ai/conversations/` - List conversations

### Example API Usage

```bash
# Register a new user
curl -X POST http://localhost:8001/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "secure_password123",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Login to get tokens
curl -X POST http://localhost:8001/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password123"
  }'

# Use token to access protected endpoints
curl -X GET http://localhost:8001/api/auth/user/ \
  -H "Authorization: Bearer <your-access-token>"
```


## 🧪 Testing

### Running Tests

```bash
# All tests
make test-all

# Backend only
make backend-test

# Frontend only  
make frontend-test

# With coverage
docker compose exec backend coverage run --source='.' manage.py test
docker compose exec backend coverage report
```

### Test Structure

- **Backend**: Django TestCase for models, views, and API endpoints
- **Frontend**: React Testing Library for components and integration tests
- **CI/CD**: Automated testing on pull requests

## 📊 Observability & Monitoring

The YC Platform includes a comprehensive observability stack with distributed tracing, metrics collection, and monitoring dashboards.

### Features

- **Distributed Tracing**: Track requests across all services (frontend → backend → code executor)
- **Metrics Collection**: HTTP requests, response times, code execution metrics, database connections
- **Centralized Logging**: Structured logs aggregation with Loki and log correlation with traces
- **Real-time Dashboards**: Pre-configured Grafana dashboards for system monitoring
- **Error Tracking**: Automatic error detection and alerting

### Quick Setup

```bash
# Setup observability stack
./yc-observability/setup.sh

# Or manually
docker-compose up -d jaeger otel-collector prometheus grafana loki
```

### Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin)
  - YC Platform Overview dashboard
  - Detailed metrics and performance monitoring
  - Centralized logs dashboard with filtering and search
- **Jaeger**: http://localhost:16686
  - Distributed trace visualization
  - Service dependency mapping
- **Prometheus**: http://localhost:9090
  - Raw metrics and custom queries
- **Loki**: http://localhost:3100
  - Log aggregation and querying API

### Key Observability Data

- **HTTP Requests**: Rate, duration, error rate by service and endpoint
- **Code Execution**: Execution count, duration, memory usage by language
- **Database**: Active connections, query performance
- **User Actions**: Frontend interactions, navigation patterns
- **Structured Logs**: Application logs with correlation IDs, user context, and error details
- **Container Logs**: Docker container logs with automatic service labeling

For detailed observability documentation, see [yc-observability/README.md](yc-observability/README.md).

## 🚀 Production Deployment

### Production Build

```bash
# Build and start production services (includes observability)
make prod-build
make prod-up

# Or with Docker Compose
docker compose -f docker-compose.prod.yml up --build -d
```

## 🔍 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using the ports
lsof -i :3000  # Frontend
lsof -i :8001  # Backend
lsof -i :5432  # Database
```

**Database connection issues:**
```bash
# Reset database
make db-reset

# Check database logs
make logs SERVICE=db
```

**Permission issues:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

### Development Tips

1. **Hot Reloading**: Code changes automatically reload in development
2. **Database Persistence**: Data persists between container restarts
3. **Logs**: Use `make logs SERVICE=name` to debug issues
4. **Shell Access**: Use `make backend-shell` or `make frontend-shell`

## 🤝 Contributing

- Clone the repository with ssh url
- git checkout main
- git pull origin main
- Create a feature branch: `git checkout -b feature-name`
- git rebase main (optiona if main has new changes after creating feature branch)
- make dev
- Do code changes changes 
- make backend-format-fix
- Commit changes: `git commit -m "<feat>(<scope>): <short summary>"`
- Push to branch: `git push origin feature-name`
- Create a Pull Request

### Code Standards

- **Backend**: Black formatting, Flake8 linting, Django best practices
- **Frontend**: Prettier formatting, ESLint linting, TypeScript strict mode
- **Testing**: Maintain test coverage above 80%
- **Commits**: See the "Conventional Commits" section below for guidelines and examples
# Conventional Commits

We follow the Conventional Commits specification: https://www.conventionalcommits.org/en/v1.0.0/

Summary:

- Format: `<type>(<scope>): <short summary>`
- Optional body and footer, separated by a blank line
- Use `BREAKING CHANGE: <description>` in the footer or append `!` after the type/scope to indicate breaking changes

Common types and examples
```
feat(auth): add Google OAuth login
   - Adds support for signing in with Google and links new users to existing accounts

fix(api): correct user serialization in GET /api/auth/user/
   - Fixes bug where is_active flag wasn't returned

docs(readme): update database setup instructions
   - Clarifies steps for local Postgres credentials

style(ui): adjust button padding
   - Whitespace, formatting, and small UI tweaks with no logic changes

refactor(auth): extract token helpers into utils/token.py
   - Code restructuring without changing external behavior

perf(api): reduce DB queries on dashboard endpoint
   - Improves response time by introducing select_related

test(auth): add tests for refresh token flow
   - Adds unit & integration tests; no production behavior changed

build(docker): update Node base image to 20
   - Changes build system, affects CI and production images

ci(github): add pipeline step for frontend linting
   - Changes CI configuration only

chore(deps): bump django from 4.2 to 4.2.3
   - Routine tasks and maintenance (dependencies, scripts)

revert: Revert "feat(auth): add Google OAuth login"
   - Reverts a previous commit

feat!: drop support for Python 3.8
   - BREAKING CHANGE: minimum Python version is now 3.9

feat(auth)!: change password hashing algorithm
   - BREAKING CHANGE: existing passwords must be rehashed on next login
```

Notes and tips

- Scope is optional but recommended (e.g., `feat(api): ...`, `fix(ui): ...`).
- Keep the subject line short (<= 72 characters) and use the body for details.
- Use the footer for metadata like `BREAKING CHANGE` or issue references (e.g., `Closes #123`).
- Revert commits should reference the original commit being reverted.

For full specification and more examples, see the official site: https://www.conventionalcommits.org/en/v1.0.0/

# GitHub issues & projects

You can reference GitHub issues and projects from your commit messages. Using the right keywords in the footer (for example `Closes`, `Fixes`) will let GitHub automatically close issues when the commit is merged. For cross-repository references use the full `owner/repo#issue-number` form.

Examples (issues)
```
feat(auth): add Google OAuth login

Adds support for signing in with Google and links new users to existing accounts.

Closes #42
```

```
fix(api): correct user serialization in GET /api/auth/user/

Fixes bug where is_active flag wasn't returned for some users.

Fixes mentorxindia/yuvro-code#101
```

```
refactor(db): split user model helpers

Restructure helpers into `yc-backend-api/auth/utils.py`.

```

# Show all commands
make help

# Development
make dev
make stop
make logs SERVICE=backend

# Package installation
make backend-install PKG=requests
make frontend-install PKG=axios

# Testing and formatting
make test-all
make format-all
make check-all


Grafana: http://localhost:3001 (admin/admin)
Jaeger: http://localhost:16686
Prometheus: http://localhost:9090
