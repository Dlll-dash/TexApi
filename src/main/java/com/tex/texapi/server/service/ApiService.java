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


}
