package com.tex.texapi.pojo.dto;


import lombok.Data;

@Data
//参数实体类: 包括了Param,Body,Header等参数类型
public class ParamDTO {
    //参数名
    String name;
    //参数值
    String value;
    //参数类型
    String type;
    //说明
    String explanation;
    //参数格式
    String formatType;
    //所属接口id
    Long apiId;
}
