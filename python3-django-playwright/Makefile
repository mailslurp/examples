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
		API_KEY=$(API_KEY) pytest;

test: venv/bin/active
	( \
		source env/bin/activate;\
		API_KEY=$(API_KEY) python3 test.py;\
	)   
