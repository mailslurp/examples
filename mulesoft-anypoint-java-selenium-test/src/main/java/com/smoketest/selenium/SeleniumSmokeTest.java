package com.smoketest.selenium;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.By;

public class SeleniumSmokeTest {
	public static void runTest() {
        WebDriver driver = null;
        try {
            // Assumes Chrome is installed on the machine
            driver = new ChromeDriver();

            driver.get("https://playground.mailslurp.com");

            String bodyText = driver.findElement(By.tagName("body")).getText();

            if (!bodyText.contains("Sign in to your account")) {
                throw new RuntimeException("Assertion failed: text not found");
            }

            System.out.println("SUCCESS: Text found on page");

        } finally {
            if (driver != null) {
                driver.quit();
            }
        }
    }
}
