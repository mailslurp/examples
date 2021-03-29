*** Settings ***
Documentation     A resource file with reusable keywords and variables.
...
...               The system specific keywords created here form our own
...               domain specific language. They utilize keywords provided
...               by the imported SeleniumLibrary.
Library           SeleniumLibrary
Library           ./MailSlurp.py    ${MAILSLURP_API_KEY}

*** Variables ***
${MAILSLURP_API_KEY}    PUT_YOUR_KEY_HERE
${SERVER}               playground.mailslurp.com
${BROWSER}              Firefox
${DELAY}                0
${PLAYGROUND URL}       https://${SERVER}/
${TEST_PASSWORD}        test-password

# see https://robotframework.org/SeleniumLibrary/SeleniumLibrary.html for selenium keywords
*** Keywords ***
Create Email Address
    ${inbox}    Create Inbox
    [return]    ${inbox}

Open Browser To Home Page
    Open Browser    ${PLAYGROUND URL}    ${BROWSER}
    Maximize Browser Window
    Set Selenium Speed    ${DELAY}
    Home Page Should Be Open

Home Page Should Be Open
    Title Should Be    React App

SignUp Page Should Be Open
    Wait Until Element Contains     //*[@data-test="sign-up-header-section"]//span   Sign Up

Go To SignUp Page
    Go To    ${PLAYGROUND URL}
    Home Page Should Be Open
    Click Element   //a[@data-test="sign-in-create-account-link"]
    SignUp Page Should Be Open

Input Username
    [Arguments]    ${username}
    Input Text     //*[@name="email"]    ${username}

Input Password
    [Arguments]    ${password}
    Input Text    //*[@name="password"]    ${password}

Submit Credentials
    Click Button    //button[@data-test="sign-up-create-account-button"]

Confirm Page Should Be Open
    Wait Until Element Contains     //*[@data-test="confirm-sign-up-header-section"]//span   Confirm

Welcome Page Should Be Open
    Location Should Be    ${WELCOME URL}
    Title Should Be    Welcome Page