package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.entity.TeamMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TeamMemberMapper {

    /**
     * 新增团队成员
     * @param member
     */
    void addMember(TeamMember member);

    /**
     * 更新成员角色
     * @param member
     */
    void updateRole(TeamMember member);

    /**
     * 移除团队成员
     * @param member
     */
    void deleteMember(TeamMember member);

    /**
     * 根据成员ID查询
     * @param id
     * @return
     */
    @Select("select * from team_member where id = #{id}")
    TeamMember getById(Long id);

    /**
     * 根据用户ID和团队ID查询
     * @param userId
     * @param teamId
     * @return
     */
    @Select("select * from team_member where user_id = #{userId} and team_id = #{teamId}")
    TeamMember getByUserTeamId(Long userId, Long teamId);

    /**
     * 查询团队下所有成员
     * @param teamId
     * @return
     */
    @Select("select * from team_member where team_id = #{teamId} order by role desc")
    List<TeamMember> getMembersByTeamId(Long teamId);
}
