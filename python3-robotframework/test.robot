*** Settings ***
Documentation     A test suite with a single test for valid login.
...
...               This test has a workflow that is created using keywords in
...               the imported resource file.
Resource          resource.robot

*** Test Cases ***
Valid Login
    ${inbox}    Create Email Address
    Open Browser To Home Page
    Go To SignUp Page
    Input Username    ${inbox.email_address}
    Input Password    ${TEST_PASSWORD}
    Submit Credentials
    Confirm Page Should Be Open
    [Teardown]    Close Browser