package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.entity.Project;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Mapper
public interface ProjectUserMapper {

    /**
     * 获取项目列表
     * @param id
     * @return
     */
    @Select("select pu.project_id as id,p.name as name from project_user pu join project p on pu.project_id = p.id where pu.user_id=#{id}")
    List<Project> getProjectList(Long id);

    /**
    * 根据项目id删除项目用户关联关系
    * @param projectId
    */
    @Delete("delete from project_user where project_id=#{projectId} and user_id=#{userId}")
    void deleteProjectUser(Long projectId, Long userId);

    /**
     * 新增项目用户关联关系
     * @param id
     * @param userId
     */
    @Insert("insert into project_user(project_id,user_id) values(#{id},#{userId})")
    void addProjectUser(Long id, Long userId);
}
