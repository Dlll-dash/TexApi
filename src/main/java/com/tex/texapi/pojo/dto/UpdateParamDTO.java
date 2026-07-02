package com.tex.texapi.pojo.dto;

import lombok.Data;

@Data
public class UpdateParamDTO {
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
    //是否必须
    Boolean isNecessary;
    //是否选中
    Boolean isChecked;

}
