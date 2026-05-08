package com.tex.texapi.server.service.impl;

import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.pojo.entity.Project;
import com.tex.texapi.server.mapper.ProjectMapper;
import com.tex.texapi.server.mapper.ProjectUserMapper;
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
     * 获取项目列表
     * @param id
     */
    @Override
    public List<Project> getProjectList(Long id) {
        //根据用户id获取项目列表
        List<Project>list =projectUserMapper.getProjectList(id);
        return list;
    }

    /**
     * 创建项目
     * @param project
     */
    @Override
    @Transactional
    public void createProject(Project project) {
        projectMapper.createProject(project);
        //创建项目后，自动添加项目成员关系，暂定项目创建者为管理员
        Long userId = BaseContext.getCurrentId();
        projectUserMapper.addProjectUser(project.getId(),userId);
    }

    /**
     * 修改项目信息
     * @param project
     */
    @Override
    public void updateProject(Project project) {
        //直接修改项目信息，暂不考虑权限问题
        projectMapper.updateProject(project);

    }

    @Override
    @Transactional
    public void deleteProject(Long id) {
        //如果是项目管理员，删除项目（暂定项目创建者为管理员）
        Long userId = BaseContext.getCurrentId();
        //删除项目成员关系
        projectUserMapper.deleteProjectUser(id,userId);
        if(projectMapper.isProjectAdmin(userId,id)) {
            //如果是管理员，删除项目
            projectMapper.deleteProject(id);
        }
    }


}
