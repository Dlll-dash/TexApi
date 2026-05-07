package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.entity.Project;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ProjectMapper {



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
     * 根据项目id和用户id判断是否是项目管理员
     * 暂定项目管理员为项目创建者
     * @param userId
     * @param id
     * @return
     */
    @Select("select count(*) from project where id=#{id} and create_user=#{userId}")
    boolean isProjectAdmin(Long userId, Long id);

    /**
     * 创建项目
     * @param project
     */
    void createProject(Project project);
}
