package com.example.insta.user;

import com.example.insta.common.api.UserSummary;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A demo user. The user set is fixed and only written by the demo seed. */
@Entity
@Table(name = "users")
public class User {

    @Id
    private String id;
    private String username;
    private String displayName;
    private String bio;

    protected User() {
    }

    public String getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getBio() {
        return bio;
    }

    public UserSummary toSummary() {
        return new UserSummary(id, username, displayName);
    }
}
