# ============================================================================
# Production Commands
# ============================================================================

# Start production containers (uses .env.prod)
up:
	docker compose --env-file .env.prod up -d

# Stop production containers
down:
	docker compose down

# Rebuild production containers
build:
	docker compose build

# Show production logs
logs:
	docker compose logs -f

# Show production container status
status:
	@docker ps --filter "name=soulful-bot" --filter "name=soulful-postgres"

# ============================================================================
# Development Commands
# ============================================================================

# Start development containers (uses .env.dev)
dev:
	docker compose -f docker-compose.dev.yml --env-file .env.dev up -d --build

# Stop development containers
dev-down:
	docker compose -f docker-compose.dev.yml down

# Show development logs
dev-logs:
	docker logs -f soulful-bot-dev

# Show development container status
dev-status:
	@docker ps --filter "name=soulful.*dev"

# ============================================================================
# Database Commands
# ============================================================================

# Connect to production database shell
db-shell:
	docker exec -it soulful-postgres psql -U $(PGUSER) -d $(PGDATABASE)

# Connect to development database shell
dev-db-shell:
	docker exec -it soulful-postgres-dev psql -U $(PGUSER) -d $(PGDATABASE)

# Reset development database
dev-db-reset:
	@make dev-down
	docker volume rm soulful-bot_my_pgdata_dev 2>/dev/null || true
	@make dev

# ============================================================================
# Cleanup Commands
# ============================================================================

# Stop and remove production containers, networks, and volumes
clean:
	docker compose down -v

# Stop and remove development containers, networks, and volumes
dev-clean:
	docker compose -f docker-compose.dev.yml down -v

# Force stop and remove ALL containers (dev + prod)
force-clean:
	@echo "Force stopping all containers..."
	-docker stop soulful-bot soulful-bot-dev soulful-postgres soulful-postgres-dev 2>/dev/null || true
	@echo "Force removing all containers..."
	-docker rm -f soulful-bot soulful-bot-dev soulful-postgres soulful-postgres-dev 2>/dev/null || true
	@echo "Cleaning up compose environments..."
	-docker compose down -v --remove-orphans 2>/dev/null || true
	-docker compose -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
	@echo "Done. All containers stopped and removed."

# ============================================================================
# Help
# ============================================================================

help:
	@echo "Soulful Bot - Makefile Commands"
	@echo ""
	@echo "Production:"
	@echo "  make up         - Start production containers (uses .env.prod)"
	@echo "  make down       - Stop production containers"
	@echo "  make build      - Rebuild production containers"
	@echo "  make logs       - Show production logs"
	@echo "  make status     - Show production container status"
	@echo ""
	@echo "Development:"
	@echo "  make dev        - Start development containers (uses .env.dev)"
	@echo "  make dev-down   - Stop development containers"
	@echo "  make dev-logs   - Show development logs"
	@echo "  make dev-status - Show development container status"
	@echo ""
	@echo "Database:"
	@echo "  make db-shell      - Connect to production database shell"
	@echo "  make dev-db-shell  - Connect to development database shell"
	@echo "  make dev-db-reset  - Reset development database"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean      - Stop and remove production containers/volumes"
	@echo "  make dev-clean  - Stop and remove development containers/volumes"
	@echo "  make force-clean - Force stop and remove ALL containers"
	@echo ""
	@echo "  make help       - Show this help message"

.PHONY: up down build logs status dev dev-down dev-logs dev-status db-shell dev-db-shell dev-db-reset clean dev-clean force-clean help
