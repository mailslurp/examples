# How to send emails in R
The statistical modelling language R can also send emails! This can be very useful to notify an engineer of the results of your script.

## Setup environment
- Install RLang by [downloading it](https://cloud.r-project.org/) or run `brew install r`
- Verify RScript installation `Rscript --version`
- Install sendmailR `Rscript -e 'install.packages("sendmailR",repos="http://cran.r-project.org")'`

## Create a script
- Create a `main.r` file to like that used in this repo.
