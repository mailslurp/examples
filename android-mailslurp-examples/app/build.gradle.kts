import com.android.build.gradle.internal.tasks.factory.dependsOn

plugins {
    id("com.android.application")
    id("kotlin-android")
    id("com.google.gms.google-services")
}

tasks {
    check.dependsOn("assembleDebugAndroidTest")
}

android {
    namespace = "dev.mailslurp.examples"
    compileSdk = 36
    flavorDimensions += "minSdkVersion"
    testOptions {
        animationsDisabled = true
    }
    defaultConfig {
        applicationId = "dev.mailslurp.examples"
        minSdk = 23
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
        multiDexEnabled = true
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    implementation(project(":internal:chooserx"))
    implementation(project(":internal:lintchecks"))
    implementation("androidx.multidex:multidex:2.0.1")

    // appium
    testImplementation("io.appium:java-client:9.4.0")
    testImplementation("org.seleniumhq.selenium:selenium-java:4.33.0")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.hamcrest:hamcrest:2.2")

    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("androidx.constraintlayout:constraintlayout:2.2.1")
    implementation("androidx.vectordrawable:vectordrawable-animated:1.2.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.navigation:navigation-fragment-ktx:2.8.9")
    implementation("androidx.navigation:navigation-ui-ktx:2.8.9")

    // Import the Firebase BoM (see: https://firebase.google.com/docs/android/learn-more#bom)
    implementation(platform("com.google.firebase:firebase-bom:33.12.0"))

    // Firebase Authentication
    implementation("com.google.firebase:firebase-auth")

    // Google Identity Services SDK (only required for Auth with Google)
    implementation("androidx.credentials:credentials:1.5.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.5.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")

    // Firebase UI
    // Used in FirebaseUIActivity.
    implementation("com.firebaseui:firebase-ui-auth:9.0.0")

    // Facebook Android SDK (only required for Facebook Login)
    // Used in FacebookLoginActivity.
    implementation("com.facebook.android:facebook-login:13.2.0")
    implementation("androidx.browser:browser:1.5.0")

    androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0-alpha03")
    androidTestImplementation("androidx.test:rules:1.7.0-alpha03")
    androidTestImplementation("androidx.test:runner:1.6.2")
    androidTestImplementation("androidx.test.uiautomator:uiautomator:2.2.0")

    //<gen>android_build_gradle
    implementation("com.mailslurp:mailslurp-client-java:16.1.3")
    //</gen>
    androidTestImplementation("androidx.test.espresso:espresso-intents:3.6.1")
    androidTestImplementation("androidx.test.espresso:espresso-web:3.6.1")
    androidTestImplementation("androidx.test.espresso:espresso-idling-resource:3.6.1")
    androidTestImplementation("androidx.test.ext:junit:1.2.0-alpha01")
}
