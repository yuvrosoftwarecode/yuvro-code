#!/bin/bash

# YC Platform Observability Setup Script

set -e

echo "🚀 Setting up YC Platform Observability Stack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ docker compose is not available. Please install Docker with Compose plugin and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p yc-observability/grafana/provisioning/datasources
mkdir -p yc-observability/grafana/provisioning/dashboards
mkdir -p yc-observability/grafana/dashboards

# Set proper permissions for Grafana
echo "🔐 Setting permissions..."
sudo chown -R 472:472 yc-observability/grafana/ 2>/dev/null || true

# Start the observability stack
echo "🐳 Starting observability services..."
docker compose up -d jaeger otel-collector prometheus grafana

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check Grafana
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Grafana is running at http://localhost:3001 (admin/admin)"
else
    echo "⚠️  Grafana might not be ready yet"
fi

# Check Jaeger
if curl -s http://localhost:16686/api/services > /dev/null; then
    echo "✅ Jaeger is running at http://localhost:16686"
else
    echo "⚠️  Jaeger might not be ready yet"
fi

# Check Prometheus
if curl -s http://localhost:9090/-/healthy > /dev/null; then
    echo "✅ Prometheus is running at http://localhost:9090"
else
    echo "⚠️  Prometheus might not be ready yet"
fi

# Check OpenTelemetry Collector
if curl -s http://localhost:8888/metrics > /dev/null; then
    echo "✅ OpenTelemetry Collector is running"
else
    echo "⚠️  OpenTelemetry Collector might not be ready yet"
fi

echo ""
echo "🎉 Observability stack setup complete!"
echo ""
echo "📊 Access your dashboards:"
echo "   • Grafana: http://localhost:3001 (admin/admin)"
echo "   • Jaeger: http://localhost:16686"
echo "   • Prometheus: http://localhost:9090"
echo ""
echo "🔧 Next steps:"
echo "   1. Start your application services: docker-compose up -d"
echo "   2. Generate some traffic to see traces and metrics"
echo "   3. Explore the pre-configured Grafana dashboards"
echo ""
echo "📚 For more information, see yc-observability/README.md"