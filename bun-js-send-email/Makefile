-include ../.env

node_modules:
	bun install

clean:
	rm -rf artifacts

fmt:
	bun fmt

test: node_modules
	#<gen>bun_run_test
	API_KEY=$(API_KEY) bun test --timeout 60000
	#</gen>
