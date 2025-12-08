# YC Full-Stack Application Commands
# Run `make help` to see available commands

.PHONY: help dev dev-detached stop restart logs setup clean rebuild
.PHONY: db-shell db-migrate db-makemigrations db-reset
.PHONY: backend-shell backend-test backend-format backend-format-fix backend-lint backend-install
.PHONY: frontend-shell frontend-test frontend-test-watch frontend-format frontend-format-fix frontend-lint frontend-install
.PHONY: test-all format-all lint-all check-all
.PHONY: prod-build prod-up prod-down
.PHONY: observability-setup observability-start observability-stop observability-logs observability-dashboards

# Default target - show available commands
help:
	@echo "YC Full-Stack Application Commands"
	@echo ""
	@echo "Development:"
	@echo "  dev                 Start all services"
	@echo "  dev-detached        Start all services in background"
	@echo "  stop                Stop all services"
	@echo "  restart             Restart all services"
	@echo "  logs [SERVICE]      View logs (optional service name)"
	@echo ""
	@echo "Setup and cleanup:"
	@echo "  setup               Initial project setup"
	@echo "  setup-testing       Setup test data for local development"
	@echo "  setup-testing-fresh Setup test data (clear existing data)"
	@echo "  clean               Clean up containers and volumes"
	@echo "  rebuild             Rebuild and restart all services"
	@echo ""
	@echo "Database operations:"
	@echo "  db-shell            Access database shell"
	@echo "  db-migrate          Run Django migrations"
	@echo "  db-makemigrations   Create Django migrations"
	@echo "  db-reset            Reset database"
	@echo ""
	@echo "Backend commands:"
	@echo "  backend-shell       Django shell"
	@echo "  backend-test        Run backend tests"
	@echo "  backend-format      Check backend code formatting"
	@echo "  backend-format-fix  Fix backend code formatting"
	@echo "  backend-lint        Lint backend code"
	@echo "  backend-install PKG Install backend package"
	@echo ""
	@echo "Code Executor commands:"
	@echo "  executor-shell      Code executor shell"
	@echo "  executor-test       Test code executor service"
	@echo "  executor-logs       View code executor logs"
	@echo ""
	@echo "Frontend commands:"
	@echo "  frontend-shell      Node.js shell"
	@echo "  frontend-test       Run frontend tests"
	@echo "  frontend-test-watch Run frontend tests in watch mode"
	@echo "  frontend-format     Check frontend code formatting"
	@echo "  frontend-format-fix Fix frontend code formatting"
	@echo "  frontend-lint       Lint frontend code"
	@echo "  frontend-install PKG Install frontend package"
	@echo ""
	@echo "Combined operations:"
	@echo "  test-all            Run all tests"
	@echo "  format-all          Format all code"
	@echo "  lint-all            Lint all code"
	@echo "  check-all           Run all checks"
	@echo ""
	@echo "Observability:"
	@echo "  observability-setup Setup observability stack"
	@echo "  observability-start Start observability services"
	@echo "  observability-stop  Stop observability services"
	@echo "  observability-logs  View observability logs"
	@echo "  observability-dashboards Open dashboards in browser"
	@echo ""
	@echo "Production commands:"
	@echo "  prod-build          Build production images"
	@echo "  prod-up             Start production services"
	@echo "  prod-down           Stop production services"

# Development commands
build:
	docker compose up --build

dev:
	docker compose up

dev-detached:
	docker compose up --build -d

stop:
	docker compose down

restart:
	docker compose restart

logs:
	@if [ "$(SERVICE)" = "" ]; then \
		docker compose logs -f; \
	else \
		docker compose logs -f $(SERVICE); \
	fi

# Setup and cleanup
setup:
	@echo "Setting up YC Full-Stack Application..."
	@echo "Checking dependencies..."
	@command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Please install Docker first."; exit 1; }
	@docker compose version >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Please install Docker Compose first."; exit 1; }
	@echo "Creating environment files..."
	@cp yc-backend-api/.env.example yc-backend-api/.env 2>/dev/null || echo "Backend .env already exists"
	@cp yc-web/.env.example yc-web/.env 2>/dev/null || echo "Frontend .env already exists"
	docker compose exec backend python manage.py setup_local_testing
	@echo "Setup complete! Run 'make dev' to start the application."

setup-testing:
	@echo "Setting up test data for local development..."
	docker compose exec backend python manage.py setup_local_testing
	docker compose exec backend python manage.py load_sample_courses --clear


setup-testing-fresh:
	@echo "Setting up fresh test data (clearing existing data)..."
	docker compose exec backend python manage.py setup_local_testing --clear
	docker compose exec backend python manage.py load_sample_courses --clear


clean:
	docker compose down -v --remove-orphans
	docker system prune -f

rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up

# Database operations
db-shell:
	docker compose exec db psql -U postgres -d yc_app

db-migrate:
	docker compose exec backend python manage.py migrate

db-makemigrations:
	docker compose exec backend python manage.py makemigrations

db-createsuperuser:
	docker compose exec backend python manage.py createsuperuser

db-reset:
	@echo "Resetting database to initial state..."
	docker compose down -v
	docker compose up -d db

# Backend commands
backend-shell:
	docker compose exec backend python manage.py shell

backend-test:
	docker compose exec backend python manage.py test

backend-format:
	docker compose exec backend black . --check --diff

backend-format-fix:
	docker compose exec backend black .

backend-lint:
	docker compose exec backend flake8 .

backend-install:
	@if [ "$(PKG)" = "" ]; then \
		echo "Usage: make backend-install PKG=package-name"; \
		exit 1; \
	fi
	docker compose exec backend pip install $(PKG)
	docker compose exec backend pip freeze > requirements.txt

# Frontend commands
frontend-shell:
	docker compose exec frontend sh

frontend-test:
	docker compose exec frontend npm test -- --run

frontend-test-watch:
	docker compose exec frontend npm test

frontend-format:
	docker compose exec frontend npm run format:check

frontend-format-fix:
	docker compose exec frontend npm run format

frontend-lint:
	docker compose exec frontend npm run lint

frontend-install:
	@if [ "$(PKG)" = "" ]; then \
		echo "Usage: make frontend-install PKG=package-name"; \
		exit 1; \
	fi
	docker compose exec frontend npm install $(PKG)

# Code Executor commands
executor-shell:
	docker compose exec code-executor sh

executor-test:
	docker compose exec code-executor python test_service.py

executor-logs:
	docker compose logs -f code-executor

# Combined operations
test-all:
	@echo "Running backend tests..."
	$(MAKE) backend-test
	@echo "Running frontend tests..."
	$(MAKE) frontend-test

format-all:
	@echo "Formatting backend code..."
	$(MAKE) backend-format-fix
	@echo "Formatting frontend code..."
	$(MAKE) frontend-format-fix

lint-all:
	@echo "Linting backend code..."
	$(MAKE) backend-lint
	@echo "Linting frontend code..."
	$(MAKE) frontend-lint

check-all:
	@echo "Running all checks..."
	$(MAKE) backend-format
	$(MAKE) backend-lint
	$(MAKE) frontend-format
	$(MAKE) frontend-lint
	$(MAKE) test-all

# Production commands
prod-build:
	docker compose -f docker-compose.prod.yml build

prod-up:
	docker compose -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.prod.yml down

# Observability commands
observability-setup:
	@echo "🚀 Setting up observability stack..."
	./yc-observability/setup.sh

observability-start:
	@echo "🐳 Starting observability services..."
	docker compose up -d jaeger otel-collector prometheus grafana

observability-stop:
	@echo "🛑 Stopping observability services..."
	docker compose stop jaeger otel-collector prometheus grafana

observability-logs:
	@echo "📋 Viewing observability logs..."
	docker compose logs -f jaeger otel-collector prometheus grafana

observability-dashboards:
	@echo "🌐 Opening observability dashboards..."
	@echo "Grafana: http://localhost:3001 (admin/admin)"
	@echo "Jaeger: http://localhost:16686"
	@echo "Prometheus: http://localhost:9090"
	@if command -v open >/dev/null 2>&1; then \
		open http://localhost:3001 & \
		open http://localhost:16686 & \
		open http://localhost:9090 & \
	elif command -v xdg-open >/dev/null 2>&1; then \
		xdg-open http://localhost:3001 & \
		xdg-open http://localhost:16686 & \
		xdg-open http://localhost:9090 & \
	else \
		echo "Please open the URLs manually in your browser"; \
	fi