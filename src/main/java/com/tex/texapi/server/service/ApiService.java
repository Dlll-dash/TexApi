package com.tex.texapi.server.service;

import com.tex.texapi.pojo.dto.ParamDTO;
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
     * @param paramDTO
     * @return Param
     */
    Params addParam(ParamDTO paramDTO);

    /**
     * 获取Query参数列表
     * @param id
     * @return
     */
    List<Params> getParams(Long id);

    /**
     * 更新Query参数信息
     * @param paramDTO
     * @param id
     * @return
     */
    void upadateParam(ParamDTO paramDTO,Long id);

        /**
        * 删除Query参数
        * @param id
        */
    void deleteParam(Long id);
}
