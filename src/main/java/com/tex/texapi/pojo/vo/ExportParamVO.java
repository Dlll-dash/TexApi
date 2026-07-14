package com.tex.texapi.pojo.vo;

import lombok.Data;

@Data
public class ExportParamVO {
    //参数名
    String name;
    //类型
    String type;
    //参数值
    String explanation;
    //是否必须
    boolean isNecessary;
}
