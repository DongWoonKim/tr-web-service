package com.trevari.spring.trwebservice.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/")
public class HomePageController {

    @Value("${services.edge-service-url:http://localhost:9000}")
    private String edgeServiceUrl;

    @GetMapping
    public String index(Model model) {
        model.addAttribute("serviceUrl", edgeServiceUrl);
        return "/main";
    }

    @GetMapping("/search")
    public String search(Model model) {
        model.addAttribute("serviceUrl", edgeServiceUrl);
        return "/search";
    }

}
