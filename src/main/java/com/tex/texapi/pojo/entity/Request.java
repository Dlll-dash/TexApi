package com.tex.texapi.pojo.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Request {

    //接口id
    Long apiId;
    //接口url
    String url;
    //Query参数
    List<Params> params;
    //请求体
    List<Params> body;
    //请求体格式
    String contentType;
    //请求头
    Map<String,String> headers;

    //format_type枚举
    public static final String Query="query";
    public static final String FormData="formData";
    public static final String Urlencoded="urlencoded";
    public static final String Json="json";
    public static final String Header="header";

    //method枚举
    public static final String GET="GET";
    public static final String POST="POST";
    public static final String PUT="PUT";
    public static final String DELETE="DELETE";
}
