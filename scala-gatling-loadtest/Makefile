include ../.env

SBT := sbt

.PHONY: all clean gatling

all: gatling

test:
	@$(SBT) "gatling:test"

clean:
	@$(SBT) clean