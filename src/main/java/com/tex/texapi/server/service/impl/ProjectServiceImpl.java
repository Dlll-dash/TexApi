package com.tex.texapi.server.service.impl;

import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.pojo.entity.Project;
import com.tex.texapi.pojo.entity.TeamMember;
import com.tex.texapi.server.annotation.TeamAuth;
import com.tex.texapi.server.mapper.*;
import com.tex.texapi.server.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProjectServiceImpl implements ProjectService {
    @Autowired
    private ProjectMapper projectMapper;
    @Autowired
    private ProjectUserMapper projectUserMapper;

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
    @TeamAuth(TeamMember.EDITOR)
    public void createProject(Project project) {
        Long userId = BaseContext.getCurrentId();
        project.setCreateUser(userId);
        project.setTeamId(BaseContext.getCurrentTeamId());
        projectMapper.createProject(project);

        //projectUserMapper.addProjectUser(project.getId(),userId);
    }

    /**
     * 修改项目信息
     * @param project
     */
    @Override
    @TeamAuth(TeamMember.EDITOR)
    public void updateProject(Project project) {
        projectMapper.updateProject(project);

    }

    /**
     * 删除项目
     * @param id
     */
    @Override
    @TeamAuth(TeamMember.OWNER)
    public void deleteProject(Long id) {
        //删除项目成员关系
        //projectUserMapper.deleteProjectUser(id,userId);

        //如果是管理员，删除项目
        projectMapper.deleteProject(id);

    }


}
