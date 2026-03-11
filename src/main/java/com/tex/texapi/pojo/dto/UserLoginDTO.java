package com.tex.texapi.pojo.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class UserLoginDTO implements Serializable {

    //用户名
    String userName;

    //密码
    String password;

}
