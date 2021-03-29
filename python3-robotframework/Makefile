-include ../.env

install:
	pip3 install -r requirements.txt

# download geckodriver
browser:
	python3 -m webdrivermanager firefox -d . -l SKIP
	sudo mv gecko/v*/gecko*/geckodriver /usr/bin/geckodriver

test: install
	python3 -m robot --variable MAILSLURP_API_KEY:$(API_KEY) --outputdir results test.robot

report:
	firefox results/report.html