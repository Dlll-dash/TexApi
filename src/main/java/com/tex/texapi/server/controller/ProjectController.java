package com.tex.texapi.server.controller;

import com.tex.texapi.common.result.Result;
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
     * 获取项目列表
     * @param id
     * @return
     */
    @GetMapping("/list/{id}")
    public Result<List>list(@PathVariable Long id){
        log.info("获取项目列表,{}",id);
        List<Project> projectList = projectService.getProjectList(id);
        return Result.success(projectList);
    }

    @PostMapping("/create")
    public Result createProject(@RequestBody Project project) {
        log.info("创建项目：{}", project);
        projectService.createProject(project);
        return Result.success();
    }

    @PutMapping("/update")
    public Result updateProject(@RequestBody Project project) {
        log.info("更新项目：{}", project);
        projectService.updateProject(project);
        return Result.success();
    }

    @DeleteMapping("/delete/{id}")
    public Result deleteProject(@PathVariable Long id) {
        log.info("删除项目：{}", id);
        projectService.deleteProject(id);
        return Result.success();
    }
}
