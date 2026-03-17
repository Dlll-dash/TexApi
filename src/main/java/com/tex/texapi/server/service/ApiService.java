package com.tex.texapi.server.service;

import com.tex.texapi.pojo.dto.AddParamDTO;
import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.entity.Params;

import java.util.List;

public interface ApiService {
    /**
     * 根据项目id获取接口列表
     * @param id
     * @return
     */
    List<Api> list(Long id);

    /**
     * 新增Query请求参数
     *
     * @param addParamDTO
     * @return Param
     */
    Params addParam(AddParamDTO addParamDTO);

    /**
     * 获取Query参数列表
     * @param id
     * @return
     */
    List<Params> getParams(Long id);
}
