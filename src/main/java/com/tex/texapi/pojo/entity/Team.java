package com.tex.texapi.pojo.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {
    //主键
    Long id;

    //团队名
    String name;

    //描述
    String description;

    //创建者
    Long createUser;

    //创建时间
    LocalDateTime createTime;
}
