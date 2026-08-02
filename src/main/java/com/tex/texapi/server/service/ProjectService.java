package com.tex.texapi.server.service;

import com.tex.texapi.pojo.dto.DeleteProjectDTO;
import com.tex.texapi.pojo.entity.Project;

import java.util.List;

public interface ProjectService {
    /**
     * 根据团队id获取项目列表
     * @param id
     */
    List<Project> getProjectList(Long id);

    /**
     * 更新项目信息
     * @param project
     */
    void updateProject(Project project);

    /**
     * 删除项目
     * @param dto
     */
    void deleteProject(DeleteProjectDTO dto);

    /**
     * 创建项目
     * @param project
     */
    void createProject(Project project);
}
