.include: ../.env

# ensure Android SDK location is set for Appium’s UiAutomator2 driver
ANDROID_HOME ?= $(HOME)/Library/Android/sdk
ANDROID_SDK_ROOT ?= $(ANDROID_HOME)

.PHONY: test-espresso

node_modules:
	npm install
	npx appium driver install uiautomator2

start-appium: node_modules
	ANDROID_HOME=$(HOME)/Library/Android/sdk ANDROID_SDK_ROOT=$(HOME)/Library/Android/sdk \
	npx appium --base-path /wd/hub

test-espresso:
	./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.API_KEY=$(API_KEY)
