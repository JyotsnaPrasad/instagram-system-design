package com.example.insta.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByUsername(String username);
}
