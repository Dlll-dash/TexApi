package com.tex.texapi.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResponseBodyVO {
    //响应体的id
    Long id;

    //响应体的内容
    String responseBody;

    //响应体的Content-Type
    String contentType;
}
