package com.tex.texapi.server.service;

import com.tex.texapi.pojo.dto.RequestDTO;
import com.tex.texapi.pojo.entity.Api;

import java.util.List;

public interface ApiService {
    /**
     * 根据项目id获取接口列表
     * @param id
     * @return
     */
    List<Api> list(Long id);

    /**
     * 更新接口信息
     * @param api
     */
    void updateApi(Api api);

    /**
     * 向指定接口发送请求
     *
     * @param requestDTO
     * @return
     */
    String send(RequestDTO requestDTO);

    /**
     * 更新接口基本信息
     * @param api
     */
    void updateInfo(Api api);
}
