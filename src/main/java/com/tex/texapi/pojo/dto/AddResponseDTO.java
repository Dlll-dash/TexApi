package com.tex.texapi.pojo.dto;

import lombok.Data;

@Data
public class AddResponseDTO {

    //所属api的id
    Long apiId;
    //响应名称
    String name;
    //响应码
    String responseCode;
    //Content-Type
    String contentType;
    //响应体
    String responseBody;
}
