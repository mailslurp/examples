-include ../.env

install:
	Rscript -e 'install.packages("sendmailR",repos="http://cran.r-project.org")'
	Rscript -e 'install.packages("httr",repos="http://cran.r-project.org")'

test:
	API_KEY=$(API_KEY) Rscript main.r
