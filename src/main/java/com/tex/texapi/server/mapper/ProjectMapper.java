package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.entity.Project;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ProjectMapper {

    @Select("select project_id as id,project_name as name from project_user where user_id=#{id}")
    List<Project> getProjectList(Long id);
}
