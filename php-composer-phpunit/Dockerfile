FROM composer
ARG API_KEY
ENV API_KEY=$API_KEY
COPY . .
RUN ["composer", "install"]
CMD ["./vendor/bin/phpunit", "test"]
