package com.tex.texapi.server.service.impl;

import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.server.mapper.ApiMapper;
import com.tex.texapi.server.service.ApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ApiServiceImpl implements ApiService {
    @Autowired
    private ApiMapper apiMapper;

    /**
     * 根据项目id获取接口列表
     * @param id
     * @return
     */
    @Override
    public List<Api> list(Long id) {
        List<Api> list=apiMapper.list(id);
        return list;
    }
}
