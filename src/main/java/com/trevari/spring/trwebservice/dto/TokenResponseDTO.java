package com.trevari.spring.trwebservice.dto;

import lombok.Builder;

@Builder
public record TokenResponseDTO(
    int status,
    String accessToken,
    String refreshToken
) {}
