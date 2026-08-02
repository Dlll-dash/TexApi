package com.tex.texapi.server.controller;

import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.DeleteProjectDTO;
import com.tex.texapi.pojo.entity.Project;
import com.tex.texapi.server.service.ProjectService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tex/project")
@Slf4j
// 项目相关接口
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    /**
     * 根据团队id获取项目列表
     * @param teamId 团队id
     * @return
     */
    @GetMapping("/list/{teamId}")
    public Result<List>list(@PathVariable Long teamId){
        log.info("获取项目列表");
        List<Project> projectList = projectService.getProjectList(teamId);
        return Result.success(projectList);
    }

    /**
     * 创建项目
     * @param project
     * @return
     */
    @PostMapping("/create")
    public Result createProject(@RequestBody Project project) {
        log.info("创建项目：{}", project);
        projectService.createProject(project);
        return Result.success();
    }

    /**
     * 修改项目基本信息
     * @param project
     * @return
     */
    @PutMapping("/update")
    public Result updateProject(@RequestBody Project project) {
        log.info("更新项目：{}", project);
        projectService.updateProject(project);
        return Result.success();
    }

    /**
     * 删除项目
     * @param id
     * @param teamId
     * @return
     */
    @DeleteMapping("/delete/{id}")
    public Result deleteProject(@PathVariable Long id, @RequestParam Long teamId) {
        log.info("删除项目：{}, teamId={}", id, teamId);
        DeleteProjectDTO dto = DeleteProjectDTO.builder()
                .projectId(id)
                .teamId(teamId)
                .build();
        projectService.deleteProject(dto);
        return Result.success();
    }
}
