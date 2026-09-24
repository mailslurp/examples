.PHONY: test dev typecheck

node_modules: package.json package-lock.json
	npm ci

dev: node_modules
	npm run dev

test: node_modules
	npm test

typecheck: node_modules
	npm run typecheck
