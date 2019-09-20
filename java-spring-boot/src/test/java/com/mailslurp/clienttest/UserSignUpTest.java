package com.mailslurp.clienttest;

import com.fasterxml.jackson.databind.ObjectMapper;
import mailslurp.ApiClient;
import mailslurp.Configuration;
import mailslurp.auth.ApiKeyAuth;
import mailslurpapi.CommonOperationsApi;
import mailslurpmodels.Email;
import mailslurpmodels.Inbox;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, classes = Application.class)
@AutoConfigureMockMvc
public class UserSignUpTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UserRepository userRepository;

    @Test(timeout = 60000)
    public void testUserSignUp() throws Exception {

        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setConnectTimeout(60000);
        ApiKeyAuth API_KEY = (ApiKeyAuth) defaultClient.getAuthentication("API_KEY");
        API_KEY.setApiKey("test");

        // create an email address
        CommonOperationsApi apiInstance = new CommonOperationsApi();
        Inbox inbox = apiInstance.createNewEmailAddressUsingPOST();

        // sign up user and check that is not verified
        String json = mvc.perform(post("/users").contentType(MediaType.APPLICATION_JSON).content(inbox.getEmailAddress()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        ObjectMapper objectMapper = new ObjectMapper();
        User user = objectMapper.readValue(json, User.class);
        assertThat(user.getVerified()).isEqualTo(false);

        // now get the verification code from our email
        Email email = apiInstance.fetchLatestEmailUsingGET(inbox.getEmailAddress(), null);
        assertThat(email.getBody()).isNotEmpty();
        String code = email.getBody().replace("\n","").replace("\r","");

        // verify the user
        mvc.perform(post("/users/" + user.getId() + "/verify").contentType(MediaType.APPLICATION_JSON).content(code))
                .andExpect(status().isOk());

        // verify the user
        String jsonVerified = mvc.perform(get("/users/" + user.getId()))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        User userVerified = objectMapper.readValue(jsonVerified, User.class);
        assertThat(userVerified.getVerified()).isEqualTo(true);

    }

}
