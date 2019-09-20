FROM composer as builder
COPY . .
RUN ["composer", "install"]

FROM php as tester
COPY --from=builder . . 
RUN ["./vendor/bin/phpunit", "test"]
