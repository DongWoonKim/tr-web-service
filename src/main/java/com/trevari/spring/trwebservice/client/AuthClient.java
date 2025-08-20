package com.trevari.spring.trwebservice.client;

import com.trevari.spring.trwebservice.dto.LoginRequestDTO;
import com.trevari.spring.trwebservice.dto.LoginResponseDTO;
import com.trevari.spring.trwebservice.dto.TokenRequestDTO;
import com.trevari.spring.trwebservice.dto.TokenResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "authClient", url = "${services.edge-service-url}/api/auth")
public interface AuthClient {
    // login
    @PostMapping("/sessions")
    LoginResponseDTO login(@RequestBody LoginRequestDTO loginRequestDTO);

    // token
    @PostMapping("/tokens")
    TokenResponseDTO token(@RequestBody TokenRequestDTO tokenRequestDTO);
}
