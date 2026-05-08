package com.tex.texapi.pojo.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AddApiDTO {
    //主键
    Long id;

    //项目id
    Long projectId;

    //接口名
    String apiName;

    //接口url
    String requestUrl;

    //接口调用方法
    String requestMethod;

    //创建时间
    LocalDateTime createTime;

    //创建者id
    Long createUser;

    //状态 0 开发中 1 维护中 2 已发行
    Integer status;

    //接口说明
    String explanation;

    //责任人
    String inChargeUser;
}
