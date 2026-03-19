package com.tex.texapi.pojo.dto;

import lombok.Data;

@Data
public class BodyParamDTO {
    //参数名
    String name;
    //参数值
    String value;
    //参数类型
    String type;
    //参数格式
    String formatType;
    //说明
    String explanation;
    //所属接口id
    Long apiId;
}
