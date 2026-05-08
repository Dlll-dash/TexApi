package com.tex.texapi.server.service;

import com.tex.texapi.pojo.dto.AddApiDTO;
import com.tex.texapi.pojo.dto.RequestDTO;
import com.tex.texapi.pojo.dto.UpdateApiInfoDTO;
import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.vo.AddApiVO;

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
     * @param updateApiInfoDTO
     */
    void updateInfo(UpdateApiInfoDTO updateApiInfoDTO);

    /**
     * 添加接口
     *
     * @param apiDTO
     * @return
     */
    AddApiVO addApi(AddApiDTO apiDTO);

    /**
     * 删除接口
     * @param id
     */
    void delete(Long id);


}
