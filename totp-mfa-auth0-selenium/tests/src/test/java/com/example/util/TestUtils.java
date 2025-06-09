package com.example.util;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;

public class TestUtils {

    /**
     * Takes a screenshot of the current browser viewport and writes it to
     * PROJECT_ROOT/screenshots/{name}.png, creating the directory if needed.
     *
     * @param driver the active WebDriver
     * @param name   a short name (no extension); e.g. "pageShowsLogin"
     * @throws IOException if the file cannot be written
     */
    public static void takeScreenshot(WebDriver driver, String name) throws IOException {
        // Grab the screenshot to a temporary file
        File src = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);

        // Determine target directory (relative to working dir = project root)
        Path screenshotsDir = Paths.get("screenshots");
        if (Files.notExists(screenshotsDir)) {
            Files.createDirectories(screenshotsDir);
        }

        // Build the destination path and copy
        Path dest = screenshotsDir.resolve(name + ".png");
        Files.copy(src.toPath(), dest, StandardCopyOption.REPLACE_EXISTING);

        System.out.println("✅ Screenshot saved: " + dest.toAbsolutePath());
    }
}