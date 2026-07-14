# MAIN
publish: build copy

AWS ?= $(shell /bin/zsh -ic 'if [[ -n $${aliases[aws]} ]]; then echo "$${aliases[aws]}"; elif command -v op >/dev/null 2>&1 && op plugin list 2>/dev/null | awk "{print \$$1}" | grep -qx aws; then echo "op plugin run -- aws"; else echo aws; fi' 2>/dev/null)

# build
build: build-manifest build-shortcodes build-readme

## build a json file with folders
build-manifest:
	ROOT=$(PWD) MANIFEST_PATH=$(PWD)/.manifest.json python3 .build/build-manifest.py

## create shortcodes
build-shortcodes:
	DEBUG=script* npm run shortcodes
	@echo "Now run 'make copy'"

## template the readme
build-readme:
	DEBUG=script* npm run readme

# copy files to s3
copy: copy-shortcodes copy-manifest copy-screenshots

copy-manifest:
	$(AWS) s3 cp .manifest.json s3://assets.mailslurp.com/examples/manifest.json

copy-shortcodes:
	$(AWS) s3 cp --recursive shortcodes/ s3://api-spec.mailslurp.com/shortcodes-github

copy-screenshots:
	$(AWS) s3 cp --recursive php-laravel-phpunit/tests/Browser/screenshots/ s3://api-spec.mailslurp.com/test-screenshots/examples/php-laravel-phpunit
	$(AWS) s3 cp --recursive javascript-cypress-newsletter-signup/cypress/screenshots/spec.cy.js/ s3://api-spec.mailslurp.com/test-screenshots/examples/cypress-newsletter-signup

# checks
check-actions:
	python3 .build/check-actions.py
check-deps:
	python3 .build/check-deps.py
