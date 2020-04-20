-include ../.env

docker:
	docker build -t php --build-arg API_KEY=$(API_KEY) . && docker run php

test:
	API_KEY=$(API_KEY) php example.php
