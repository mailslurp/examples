SBT := sbt

.PHONY: all clean gatling

all: gatling

# run the full Gatling test suite
gatling:
	@$(SBT) "gatling:test"

# clean
clean:
	@$(SBT) clean