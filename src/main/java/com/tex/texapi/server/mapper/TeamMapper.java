package com.tex.texapi.server.mapper;

import com.tex.texapi.common.enumeration.OperationType;
import com.tex.texapi.pojo.entity.Team;
import com.tex.texapi.server.annotation.AutoFill;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TeamMapper {

    /**
     * 新建团队
     * @param team
     */
    @AutoFill(OperationType.INSERT)
    void addTeam(Team team);

    /**
     * 更新团队信息
     * @param team
     */
    void updateTeam(Team team);

    /**
     * 删除团队
     * @param id
     */
    @Delete("delete from team where id = #{id}")
    void deleteTeam(Long id);

    /**
     * 根据ID查询团队
     * @param id
     * @return
     */
    @Select("select * from team where id = #{id}")
    Team getById(Long id);

    /**
     * 查询用户所在的所有团队
     * @param userId
     * @return
     */
    List<Team> getByUserId(Long userId);
}
