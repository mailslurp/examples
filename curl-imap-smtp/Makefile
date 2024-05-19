-include ../.env
.PHONY: test

SHELL_SCRIPTS = $(wildcard *.sh)

test: $(SHELL_SCRIPTS)
	for file in $^ ; do API_KEY=$(API_KEY) ./$$file ; done
 
