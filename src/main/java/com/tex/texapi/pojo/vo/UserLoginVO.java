package com.tex.texapi.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class UserLoginVO implements Serializable {

    //主键（内部使用）
    Long id;

    //对外唯一标识
    String uuid;

    //用户名
    String userName;

    //姓名
    String name;

    //JWT令牌
    String token;
}
