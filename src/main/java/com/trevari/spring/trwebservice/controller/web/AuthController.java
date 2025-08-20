package com.trevari.spring.trwebservice.controller.web;

import com.trevari.spring.trwebservice.dto.LoginRequestDTO;
import com.trevari.spring.trwebservice.dto.LoginResponseDTO;
import com.trevari.spring.trwebservice.dto.TokenResponseDTO;
import com.trevari.spring.trwebservice.service.AuthService;
import com.trevari.spring.trwebservice.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/sessions")
    public LoginResponseDTO login(
            @RequestBody LoginRequestDTO loginRequestDTO,
            HttpServletResponse response
    ) {
        LoginResponseDTO result = authService.login(loginRequestDTO);

        if (result == null) {
            throw new IllegalArgumentException("로그인 실패: 사용자 정보를 찾을 수 없습니다.");
        }

        if (result.refreshToken() != null && !result.refreshToken().isBlank()) {
            addRefreshTokenCookieIfPresent(response, result.refreshToken());
        }

        return result;
    }

    @PostMapping("/tokens")
    public TokenResponseDTO token(HttpServletRequest request) {
        return authService.getToken(request.getCookies());
    }


    private void addRefreshTokenCookieIfPresent(HttpServletResponse response, String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            CookieUtil.addCookie(response, "refreshToken", refreshToken, 7 * 24 * 60 * 60); // 7일
        }
    }

}
