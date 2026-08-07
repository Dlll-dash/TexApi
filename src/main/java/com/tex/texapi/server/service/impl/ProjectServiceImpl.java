package com.tex.texapi.server.service.impl;

import com.tex.texapi.common.constant.MessageConstant;
import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.common.exception.InputException;
import com.tex.texapi.common.exception.NoPermissionException;
import com.tex.texapi.pojo.dto.DeleteProjectDTO;
import com.tex.texapi.pojo.entity.Project;
import com.tex.texapi.server.mapper.*;
import com.tex.texapi.server.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Stream;

@Service
public class ProjectServiceImpl implements ProjectService {
    @Autowired
    private ProjectMapper projectMapper;
    @Autowired
    private CategoryMapper categoryMapper;
    @Autowired
    private ApiMapper apiMapper;
    @Autowired
    private RequestParamsMapper requestParamsMapper;
    @Autowired
    private ResponseMapper responseMapper;

    /**
     * 根据团队id获取项目列表
     * @param id
     */
    @Override
    public List<Project> getProjectList(Long id) {
        //根据团队id获取项目列表
        List<Project>list =projectMapper.getProjectList(id);
        return list;
    }

    /**
     * 创建项目
     * @param project
     */
    @Override
    @Transactional
    public void createProject(Project project) {
        Long userId = BaseContext.getCurrentId();
        project.setCreateUser(userId);
        projectMapper.createProject(project);

        //projectUserMapper.addProjectUser(project.getId(),userId);
    }

    /**
     * 修改项目信息
     * @param project
     */
    @Override
    public void updateProject(Project project) {
        //校验项目归属：项目必须属于声明的团队
        Project existing = projectMapper.getById(project.getId());
        if (existing == null) {
            throw new InputException(MessageConstant.NOT_FOUND);
        }
        if (!existing.getTeamId().equals(project.getTeamId())) {
            throw new NoPermissionException(MessageConstant.PERMISSION_DENIED);
        }
        projectMapper.updateProject(project);

    }

    /**
     * 删除项目
     * @param dto
     */
    @Override
    public void deleteProject(DeleteProjectDTO dto) {
        Long projectId = dto.getProjectId();
        Project existing = projectMapper.getById(projectId);
        if (existing == null) {
            throw new InputException(MessageConstant.NOT_FOUND);
        }
        if (!existing.getTeamId().equals(dto.getTeamId())) {
            throw new NoPermissionException(MessageConstant.PERMISSION_DENIED);
        }

        //级联删除：参数 → 响应 → 接口 → 分类 → 项目
        List<Long> categoryIds = categoryMapper.getIdsByProjectIds(List.of(projectId));
        List<Long> apiIdsFromCategory = categoryIds.isEmpty()
                ? List.of() : apiMapper.getIdsByCategoryIds(categoryIds);
        List<Long> apiIdsFromProject = apiMapper.getIdsByProjectIds(List.of(projectId));
        List<Long> allApiIds = Stream.concat(
                apiIdsFromProject.stream(), apiIdsFromCategory.stream()
        ).distinct().toList();

        if (!allApiIds.isEmpty()) {
            requestParamsMapper.deleteBatchByApiIds(allApiIds);
            responseMapper.deleteBatchByApiIds(allApiIds);
        }
        if (!categoryIds.isEmpty()) {
            apiMapper.deleteBatchByCategoryId(categoryIds);
        }
        apiMapper.deleteBatchByIds(allApiIds);
        categoryMapper.deleteByProjectIds(List.of(projectId));
        projectMapper.deleteProject(projectId);
    }


}
