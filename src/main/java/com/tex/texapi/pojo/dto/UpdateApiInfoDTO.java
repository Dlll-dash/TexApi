package com.tex.texapi.pojo.dto;

import lombok.Data;

@Data
public class UpdateApiInfoDTO {
    //api的id
    Long id;
    //api名称
    String apiName;
    //状态
    Integer status;
    //接口说明
    String explanation;
    //责任人
    String inChargeUser;
}
