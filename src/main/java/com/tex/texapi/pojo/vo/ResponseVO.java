package com.tex.texapi.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResponseVO {

    //主键
    Long id;
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
