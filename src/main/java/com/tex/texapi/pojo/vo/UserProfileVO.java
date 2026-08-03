package com.tex.texapi.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileVO implements Serializable {
    //用户id
    Long id;

    //用户姓名
    String name;

    //用户名
    String userName;

    //性别
    String gender;

    //手机号码
    String phone;

    //邮箱
    String email;
}
