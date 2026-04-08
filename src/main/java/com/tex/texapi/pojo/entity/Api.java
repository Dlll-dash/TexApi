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
public class Api {
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

    //请求头
    String requestHeader;

    //请求参数
    String requestParam;

    //请求示例
    String responseExample;

    //创建时间
    LocalDateTime createTime;

    //创建者
    String createUser;

    //状态 0禁用 1启用
    Integer status;

    //接口说明
    String explanation;

    //责任人
    Long inChargeUser;
}
