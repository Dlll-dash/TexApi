package com.tex.texapi.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class UserLoginVO {

    //主键
    Long id;

    //用户名
    String userName;

    //姓名
    String name;

    //JWT令牌
    String token;
}
