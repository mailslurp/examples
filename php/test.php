<?php
require_once(__DIR__ . '/vendor/autoload.php');

use PHPUnit\Framework\TestCase;

final class EmailTest extends TestCase
{
	public function testCanUseMailSlurpInPHP(): void
	{

    // configure client
		$config = MailSlurpSDK\Configuration::getDefaultConfiguration()->setApiKey('x-api-key', 'test');

		$apiInstance = new MailSlurpSDK\MailSlurpAPI\CommonOperationsApi(
			new GuzzleHttp\Client(),
			$config
		);

		$result = $apiInstance->createNewEmailAddressUsingPOST();

		$this->assertStringContainsString(
			"mailslurp.com",
			$result["email_address"]
		);
	}

}
