package com.mailslurp.clienttest;

import java.util.UUID;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import lombok.Data;

@Entity
@Data
public class User {
    @Id
    @GeneratedValue
    private UUID id;

    private String emailAddress;

    private String verificationCode;

    private Boolean verified;
}
