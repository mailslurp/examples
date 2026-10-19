-include ../.env
export API_KEY MAILSLURP_API_KEY

ARGS ?=

.PHONY: test test-python test-javascript

test: test-python test-javascript

test-python:
	python3 python-device-render.py $(ARGS)

test-javascript:
	node javascript-device-render.mjs $(ARGS)
