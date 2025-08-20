package com.trevari.spring.trwebservice.dto;

public record LoginResponseDTO (
    String userName,
    String userId,
    String accessToken,
    String refreshToken
){}
