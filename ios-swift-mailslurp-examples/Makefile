DESTINATION ?= 'platform=iOS Simulator,OS=18.5,name=iPhone 16 Plus'

install:
	pod deintegrate
	pod install --repo-update

xcode:
	open AuthenticationExample.xcworkspace

list:
	xcrun simctl list devices | grep "18.0"

clean:
	xcodebuild clean

build:
	xcodebuild build-for-testing \
  -workspace AuthenticationExample.xcworkspace \
  -scheme AuthenticationExample \
  -destination $(DESTINATION)

test:
	xcodebuild test \
  -workspace AuthenticationExample.xcworkspace \
  -scheme Pods-AuthenticationExampleTests \
  -destination $(DESTINATION)
