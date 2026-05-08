package com.tex.texapi;

import lombok.extern.slf4j.Slf4j;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@MapperScan("com.tex.texapi.server.mapper")
@EnableTransactionManagement//开启注解式事务管理
@Slf4j
public class TexApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(TexApiApplication.class, args);
        log.info("server started");
    }

}
