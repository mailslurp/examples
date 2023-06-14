# PHP Laravel MailSlurp examples using PHPUnit

## Install PHP and composer

```shell
#!/bin/sh

EXPECTED_CHECKSUM="$(php -r 'copy("https://composer.github.io/installer.sig", "php://stdout");')"
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
ACTUAL_CHECKSUM="$(php -r "echo hash_file('sha384', 'composer-setup.php');")"

if [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]
then
    >&2 echo 'ERROR: Invalid installer checksum'
    rm composer-setup.php
    exit 1
fi

php composer-setup.php --quiet
RESULT=$?
rm composer-setup.php
exit $RESULT
```

Configure PHP extensions:

```shell
sudo apt-get install php-curl php-mbstring php-xml php-zip
```

## Create a project

```shell
php composer.phar create-project laravel/laravel php-laravel-phpunit
```

## Install MailSlurp

```shell
php composer.phar require --dev mailslurp/mailslurp-client-php
```

Config `config/mail.php`

## Install Dusk

```shell
php composer.phar require --dev laravel/dusk
php artisan dusk:install
php artisan dusk:chrome-driver --detect
```

## Create a mailable

```shell
php artisan make:mail Newsletter
```
