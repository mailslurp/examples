-include ../.env

install:
	Rscript -e 'install.packages("sendmailR",repos="http://cran.r-project.org")'
	Rscript -e 'install.packages("httr",repos="http://cran.r-project.org")'
	Rscript -e 'install.packages("blastula",repos="http://cran.r-project.org")'

test: smtp smtp_auth

smtp:
	API_KEY=$(API_KEY) Rscript main.r

smtp_auth:
	API_KEY=$(API_KEY) Rscript main-auth.r
