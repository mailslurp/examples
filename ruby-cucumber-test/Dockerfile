FROM ruby:2.7.1-buster
ARG API_KEY
ENV API_KEY=$API_KEY
COPY . .
RUN ["bundle", "install", "--path", "./vendor/bundle"]
CMD ["bundle", "exec", "cucumber"]
