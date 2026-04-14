package com.tex.texapi.pojo.vo;

import lombok.Data;

@Data
public class ResponseListVO {
    //响应体的id
    Long id;

    //响应体的Content-Type
    String contentType;

     //响应体的状态
    String responseCode;

     //响应体的名称
    String name;
}
