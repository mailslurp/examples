# PHP Laravel MailSlurp examples using PHPUnit
This example project demonstrates how to configure MailSlurp with PHP Laravel and PHPUnit.

You can use MailSlurp to send emails (Mailable/Notification) in your application and also to test that emails are received during Dusk tests.

## Run the tests
Set `API_KEY` to your MailSlurp API Key and run the tests:

```shell
make dev && make test
```

## Setup 
To setup the project locally:

### Install PHP and composer

Use the following script to install composer:

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

### Create a project

```shell
php composer.phar create-project laravel/laravel php-laravel-phpunit
```

### Install MailSlurp

```shell
php composer.phar require --dev mailslurp/mailslurp-client-php
```

Configure `config/mail.php`. See the example file.

### Install Dusk

```shell
php composer.phar require --dev laravel/dusk
php artisan dusk:install
php artisan dusk:chrome-driver --detect
```

### Create a mailable

```shell
php artisan make:mail Newsletter
php artisan make:notification NewsletterNotification
```
