package com.tex.texapi.server.service;

import com.tex.texapi.pojo.entity.Project;

import java.util.List;

public interface ProjectService {
    /**
     * 获取项目列表
     * @param id
     */
    List<Project> getProjectList(Long id);
}
