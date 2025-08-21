package com.trevari.spring.trwebservice.controller.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/auth")
public class AuthPageController {

    @Value("${services.edge-service-url:http://localhost:9000}")
    private String edgeServiceUrl;


    @GetMapping("/join")
    public String joinPage(Model model) {
        model.addAttribute("edgeServiceUrl", edgeServiceUrl);
        return "auth/join";
    }

    @GetMapping("/login")
    public String loginPage(Model model) {
        model.addAttribute("edgeServiceUrl", edgeServiceUrl);
        return "auth/login";
    }

}
