package com.tex.texapi.pojo.vo;

import lombok.Data;

@Data
public class ExportResponseVO {
    //响应体的id
    Long id;

    //响应名称
    String name;

    //响应码
    String responseCode;

    //Content-Type
    String contentType;

    //响应体
    String responseBody;
}
