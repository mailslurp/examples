build:
	python3 .build.py

ci-env:
	echo "API_KEY=$$API_KEY" > .env

copy:
	aws s3 cp .manifest.json s3://assets.mailslurp.com/examples/manifest.json

deploy: build copy
	git push ci master
