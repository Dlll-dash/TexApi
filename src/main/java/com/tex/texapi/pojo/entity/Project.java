package com.tex.texapi.pojo.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project{
    //项目id
    Long id;
    //项目名
    String name;
    //项目描述
    String description;
    //创建时间
    LocalDateTime createTime;
    //创建用户
    Long createUser;
    //所属团队id
    Long teamId;
}
