<?php
$YOUR_API_KEY = getenv("API_KEY");
$url = "https://api.mailslurp.com/sendEmail";
$options = array(
    'https' =>
        array(
            'method' => 'POST',
            'header' => 'Content-type: application/json',
            'content' => json_encode(array(
                'to' => "jackmahoney212@gmail.com", // use your own email to test
                'body' => "Hello!"
            ))
        )
);
$streamContext = stream_context_create($options);
$result = file_get_contents($url, false, $streamContext);
if ($result === false) {
    $error = error_get_last();
    throw new Exception('POST request failed: ' . $error['message']);
}
print_r($result);
