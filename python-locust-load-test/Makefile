-include ../.env
SHELL := /bin/bash
venv/bin/active:
	( \
		python3 -m venv env;\
		source env/bin/activate;\
		pip3 install -r requirements.txt;\
	)

fmt: venv/bin/active
	( \
		source env/bin/activate;\
		python3 -m black .;\
	)

test-ci:
		pip3 install -r requirements.txt;
		API_KEY=$(API_KEY) locust --headless -u 1 -r 1 -t 60s --host https://api.mailslurp.com;\

test: venv/bin/active
	( \
		source env/bin/activate;\
		API_KEY=$(API_KEY) locust --headless -u 1 -r 1 -t 60s --host https://api.mailslurp.com;\
	)

test-ui: venv/bin/active
	( \
		source env/bin/activate;\
		API_KEY=$(API_KEY) locust;\
	)