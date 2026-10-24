.POSIX:
COMPOSE_FILE = infra/docker/docker-compose.yml
COMPOSE_OVERRIDE = infra/docker/docker-compose.override.yml
ENV_FILE =
SERVICES = user-service event-service booking-service payment-service
FRONTENDS = frontend
RESOLVE_ENV = ef="$(ENV_FILE)"; if [ -z "$$ef" ]; then if [ -f infra/.env ]; then ef=infra/.env; else ef=infra/.env.example; fi; fi
COMPOSE = docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_OVERRIDE) --env-file "$$ef"

.PHONY: help up down clean logs ps build test lint format compose-config

help:
	@echo "Targets:"
	@echo "  help            Show this help (default)"
	@echo "  up              Build and start the stack in the background"
	@echo "  down            Stop and remove the stack containers"
	@echo "  clean           Stop the stack and delete its volumes"
	@echo "  logs            Follow the stack logs"
	@echo "  ps              List the stack containers"
	@echo "  build           Package every service and build every frontend"
	@echo "  test            Run the test suite of every service"
	@echo "  lint            Check formatting and lint every service and frontend"
	@echo "  format          Apply spotless and prettier formatting"
	@echo "  compose-config  Validate the compose files (base + dev override)"
	@echo "Variables: COMPOSE_FILE=$(COMPOSE_FILE) COMPOSE_OVERRIDE=$(COMPOSE_OVERRIDE) ENV_FILE (default: infra/.env, else infra/.env.example)"

up:
	$(RESOLVE_ENV); $(COMPOSE) up -d --build

down:
	$(RESOLVE_ENV); $(COMPOSE) down

clean:
	$(RESOLVE_ENV); $(COMPOSE) down -v

logs:
	$(RESOLVE_ENV); $(COMPOSE) logs -f

ps:
	$(RESOLVE_ENV); $(COMPOSE) ps

build:
	for s in $(SERVICES); do (cd services/$$s && ./mvnw -q -DskipTests package) || exit 1; done
	for f in $(FRONTENDS); do (cd $$f && npm run build) || exit 1; done

test:
	for s in $(SERVICES); do (cd services/$$s && ./mvnw test) || exit 1; done

lint:
	for s in $(SERVICES); do (cd services/$$s && ./mvnw -q spotless:check checkstyle:check) || exit 1; done
	for f in $(FRONTENDS); do (cd $$f && npm run lint && npm run format:check) || exit 1; done

format:
	for s in $(SERVICES); do (cd services/$$s && ./mvnw -q spotless:apply) || exit 1; done
	for f in $(FRONTENDS); do (cd $$f && npm run format) || exit 1; done

compose-config:
	$(RESOLVE_ENV); $(COMPOSE) config -q
