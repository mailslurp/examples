package com.mailslurp.clienttest;

import java.util.UUID;

import com.mailslurp.client.ApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController()
@RequestMapping("/users")
public class UserController {

    @Autowired
    EmailService emailService;

    @Autowired
    UserRepository userRepository;

    @PostMapping
    public User signUp(
            @RequestBody String emailAddress
    ) throws ApiException {
        String code = UUID.randomUUID().toString();

        User user = new User();
        user.setEmailAddress(emailAddress);
        user.setVerified(false);
        user.setVerificationCode(code);

        User savedUser = userRepository.save(user);
        emailService.sendEmail(emailAddress, code);
        return savedUser;
    }

    @PostMapping("/{userId}/verify")
    public void verify(
            @PathVariable("userId") UUID userId,
            @RequestBody String code
    ) {
        User user = userRepository.findByIdAndVerificationCode(userId, code);
        user.setVerified(true);
        userRepository.save(user);
    }

    @GetMapping("/{userId}")
    public User getUser(
            @PathVariable("userId") UUID userId
    ) {
        return userRepository.findById(userId).get();
    }

}
