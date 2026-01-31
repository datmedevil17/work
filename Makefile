.PHONY: frontend backend dev help

# Default target
help:
	@echo "Available commands:"
	@echo "  make frontend    - Run the Next.js frontend"
	@echo "  make backend     - Run the Rust backend server"
	@echo "  make dev         - Run both frontend and backend concurrently"

# Run the Next.js frontend
frontend:
	npm run dev

# Run the Rust backend server
backend:
	cd server && cargo run

# Run both concurrently
dev:
	make -j2 frontend backend
