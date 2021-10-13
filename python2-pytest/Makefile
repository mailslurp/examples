-include ../.env

venv/bin/active:
	( \
		virtualenv -p $$(which python2) venv;\
		. venv/bin/activate;\
		pip install -r requirements.txt;\
	)

test-ci:
		pip install -r requirements.txt;
		API_KEY=$(API_KEY) pytest;

test: venv/bin/active
	( \
		. venv/bin/activate;\
		API_KEY=$(API_KEY) pytest;\
	)

