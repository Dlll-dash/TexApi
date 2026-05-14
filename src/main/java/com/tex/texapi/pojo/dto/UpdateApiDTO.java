package com.tex.texapi.pojo.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UpdateApiDTO {
    //主键
    Long id;

    //接口名
    String apiName;

    //接口url
    String requestUrl;

    //接口调用方法
    String requestMethod;

    //接口更新时间
    LocalDateTime updateTime;

    //更新者
    Long updateUser;

    //状态 0 开发中 1 维护中 2 已发行
    Integer status;


}
