package com.google.firebase.quickstart.auth

import android.content.Intent
import com.firebase.example.internal.BaseEntryChoiceActivity
import com.firebase.example.internal.Choice

class EntryChoiceActivity : BaseEntryChoiceActivity() {

    override fun getChoices(): List<Choice> {
        return listOf(

            Choice(
                "Examples",
                "MailSlurp examples activities for Android",
                Intent(this, com.google.firebase.quickstart.auth.kotlin.MainActivity::class.java),
            ),
        )
    }
}
