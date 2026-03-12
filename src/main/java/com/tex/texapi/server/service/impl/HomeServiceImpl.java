package com.tex.texapi.server.service.impl;

import com.tex.texapi.pojo.entity.Project;
import com.tex.texapi.server.mapper.ProjectMapper;
import com.tex.texapi.server.service.HomeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HomeServiceImpl implements HomeService {
    @Autowired
    private ProjectMapper projectMapper;


    /**
     * 获取项目列表
     * @param id
     */
    @Override
    public List<Project> getProjectList(Long id) {
        List<Project>list =projectMapper.getProjectList(id);
        return list;
    }
}
