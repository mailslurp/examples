# set up the tests
*** Settings ***
Documentation     Define keywords and variables and import MailSlurp functions
Library           SeleniumLibrary
Library           ./MailSlurp.py    ${MAILSLURP_API_KEY}

# define variables and default values
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
    [Return]    ${inbox}

Wait For Confirmation Code
    [Arguments]     ${inbox_id}
    ${email}    Wait For Latest Email   ${inbox_id}
    ${code}     Extract Email Content   ${email.body}
    [Return]    ${code}

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

Input Email
    [Arguments]    ${username}
    Input Text     //*[@name="email"]    ${username}

Input Username
    [Arguments]    ${username}
    Input Text     //*[@name="username"]    ${username}

Input Password
    [Arguments]    ${password}
    Input Text    //*[@name="password"]    ${password}

Input Confirmation
    [Arguments]    ${code}
    Input Text    //*[@name="code"]    ${code}

Submit Confirmation
    Click Button    //button[@data-test="confirm-sign-up-confirm-button"]

Submit Credentials
    Click Button    //button[@data-test="sign-up-create-account-button"]

Submit Login
    Click Button    //button[@data-test="sign-in-sign-in-button"]

Confirm Page Should Be Open
    Wait Until Element Contains     //*[@data-test="confirm-sign-up-header-section"]//span   Confirm

SignIn Page Should Be Open
    Wait Until Element Contains     //*[@data-test="sign-in-header-section"]//span   Sign in to your account

User Page Should Be Open
    Wait Until Page Contains    Welcome