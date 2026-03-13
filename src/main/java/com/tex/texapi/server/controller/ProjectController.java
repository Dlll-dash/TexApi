package com.tex.texapi.server.controller;

import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.entity.Project;
import com.tex.texapi.server.service.ProjectService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/tex/project")
@Slf4j
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
}
