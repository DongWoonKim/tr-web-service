package com.trevari.spring.trwebservice.dto;

import lombok.Builder;

@Builder
public record TokenRequestDTO(
        String refreshToken
) {}
