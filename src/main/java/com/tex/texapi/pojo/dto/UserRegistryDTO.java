package com.tex.texapi.pojo.dto;

import lombok.Data;

@Data
public class UserRegistryDTO {
    //用户姓名
    String name;

    //用户名
    String userName;

    //密码
    String password;

    //手机号
    String phone;

    //邮箱
    String email;
}
