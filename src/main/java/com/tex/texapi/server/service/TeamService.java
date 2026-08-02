package com.tex.texapi.server.service;

import com.tex.texapi.pojo.dto.AddTeamDTO;
import com.tex.texapi.pojo.dto.AddTeamMemberDTO;
import com.tex.texapi.pojo.dto.DeleteTeamDTO;
import com.tex.texapi.pojo.dto.RemoveMemberDTO;
import com.tex.texapi.pojo.dto.UpdateTeamDTO;
import com.tex.texapi.pojo.dto.UpdateTeamMemberDTO;
import com.tex.texapi.pojo.vo.TeamMemberVO;
import com.tex.texapi.pojo.vo.TeamVO;

import java.util.List;

public interface TeamService {

    /**
     * 当前用户的团队列表
     * @return
     */
    List<TeamVO> listTeams();

    /**
     * 创建团队
     * @param dto
     * @return
     */
    TeamVO createTeam(AddTeamDTO dto);

    /**
     * 更新团队信息
     * @param dto
     */
    void updateTeam(UpdateTeamDTO dto);

    /**
     * 删除团队
     * @param dto
     */
    void deleteTeam(DeleteTeamDTO dto);

    /**
     * 邀请成员
     * @param dto
     */
    void inviteMember(AddTeamMemberDTO dto);

    /**
     * 移除成员
     * @param dto
     */
    void removeMember(RemoveMemberDTO dto);

    /**
     * 修改成员角色
     * @param dto
     */
    void updateMemberRole(UpdateTeamMemberDTO dto);

    /**
     * 查询团队下所有成员
     * @param teamId
     * @return
     */
    List<TeamMemberVO> listMembers(Long teamId);
}
