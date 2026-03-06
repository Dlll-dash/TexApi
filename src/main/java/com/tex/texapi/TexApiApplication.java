package com.tex.texapi;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@Slf4j
public class TexApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(TexApiApplication.class, args);
        log.info("server started");
    }

}
