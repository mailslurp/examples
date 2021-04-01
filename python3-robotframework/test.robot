*** Settings ***
Documentation     Test user sign-up with MailSlurp and Robot
Resource          resource.robot

*** Test Cases ***
Sign Up With New Email Address
    ${inbox}    Create Email Address
    Open Browser To Home Page
    Go To SignUp Page
    Input Email       ${inbox.email_address}
    Input Password    ${TEST_PASSWORD}
    Submit Credentials
    Confirm Page Should Be Open
    ${code}    Wait For Confirmation Code   ${inbox.id}
    Log To Console      ${code} extacted
    Input Confirmation      ${code}
    Submit Confirmation
    SignIn Page Should Be Open
    Input Username    ${inbox.email_address}
    Input Password    ${TEST_PASSWORD}
    Submit Login
    User Page Should Be Open
    [Teardown]    Close Browser