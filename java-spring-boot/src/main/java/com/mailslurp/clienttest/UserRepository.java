package com.mailslurp.clienttest;

import java.util.UUID;
import org.springframework.data.repository.CrudRepository;

interface UserRepository extends CrudRepository<User, UUID> {
    User findByIdAndVerificationCode(UUID emailAddress, String verificationCode);
}
