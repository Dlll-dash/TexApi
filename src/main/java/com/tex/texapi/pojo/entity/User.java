package com.tex.texapi.pojo.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    //用户id
    Long id;

    //用户姓名
    String name;

    //用户名
    String userName;

    //密码
    String password;

    //性别
    String gender;

    //手机号码
    String phone;
}
