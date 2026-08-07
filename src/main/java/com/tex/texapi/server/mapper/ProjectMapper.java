package com.tex.texapi.server.mapper;

import com.tex.texapi.common.enumeration.OperationType;
import com.tex.texapi.pojo.entity.Project;
import com.tex.texapi.server.annotation.AutoFill;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ProjectMapper {

    /**
     * 根据团队id获取项目列表
     * @param id
     * @return
     */
    @Select("select * from project where team_id=#{id}")
    List<Project> getProjectList(Long id);

    /**
     * 修改项目信息
     * @param project
     */
    void updateProject(Project project);

    /**
     * 根据id删除项目
     * @param id
     */
    @Delete("delete from project where id=#{id}")
    void deleteProject(Long id);

    /**
     * 按团队ID批量删除项目
     */
    @Delete("delete from project where team_id = #{teamId}")
    void deleteByTeamId(Long teamId);

    /**
     * 创建项目
     * @param project
     */
    @AutoFill(OperationType.INSERT)
    void createProject(Project project);

    /**
     * 根据id获取项目
     * @param id
     * @return
     */
    @Select("select * from project where id=#{id}")
    Project getById(Long id);

    /**
     * 鉴权查询：一次 JOIN 返回用户在项目所属团队中的角色，无权限返回 null
     */
    Integer getUserRole(@Param("projectId") Long projectId, @Param("userId") Long userId);
}
