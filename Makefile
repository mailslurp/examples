build: build-manifest

build-manifest:
	ROOT=$(PWD) MANIFEST_PATH=$(PWD)/.manifest.json python3 .build/build-manifest.py

ci-env:
	echo "API_KEY=$$API_KEY" > .env

copy:
	aws s3 cp .manifest.json s3://assets.mailslurp.com/examples/manifest.json

deploy: build copy
	git push ci master

build-shortcodes:
	DEBUG=script* npm run shortcodes

sync-shortcodes:
	aws s3 sync shortcodes/ s3://api-spec.mailslurp.com/shortcodes-github --exact-timestamps

publish: build-shortcodes sync-shortcodes