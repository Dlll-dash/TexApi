package com.tex.texapi.server.service.impl;

import com.tex.texapi.common.constant.MessageConstant;
import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.common.exception.InputException;
import com.tex.texapi.common.exception.NoPermissionException;
import com.tex.texapi.pojo.dto.AddTeamDTO;
import com.tex.texapi.pojo.dto.AddTeamMemberDTO;
import com.tex.texapi.pojo.dto.UpdateTeamDTO;
import com.tex.texapi.pojo.dto.UpdateTeamMemberDTO;
import com.tex.texapi.pojo.entity.Team;
import com.tex.texapi.pojo.entity.TeamMember;
import com.tex.texapi.pojo.entity.User;
import com.tex.texapi.pojo.vo.TeamMemberVO;
import com.tex.texapi.pojo.vo.TeamVO;
import com.tex.texapi.server.annotation.TeamAuth;
import com.tex.texapi.server.mapper.TeamMapper;
import com.tex.texapi.server.mapper.TeamMemberMapper;
import com.tex.texapi.server.mapper.UserMapper;
import com.tex.texapi.server.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeamServiceImpl implements TeamService {

    @Autowired
    private TeamMapper teamMapper;
    @Autowired
    private TeamMemberMapper teamMemberMapper;
    @Autowired
    private UserMapper userMapper;

    /**
     * 当前用户的团队列表
     * @return
     */
    @Override
    public List<TeamVO> listTeams() {
        //根据当前用户ID查询所在团队
        Long userId = BaseContext.getCurrentId();
        List<Team> teams = teamMapper.getByUserId(userId);
        return teams.stream().map(this::toTeamVO).collect(Collectors.toList());
    }

    /**
     * 创建团队
     * @param dto
     * @return
     */
    @Override
    @Transactional
    public TeamVO createTeam(AddTeamDTO dto) {
        //校验团队名
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new InputException(MessageConstant.NAME_EMPTY);
        }

        Long userId = BaseContext.getCurrentId();
        User user = userMapper.getById(userId);

        //创建团队，AutoFill自动填充createUser和createTime
        Team team = Team.builder()
                .name(dto.getName())
                .build();
        teamMapper.addTeam(team);

        //创建者加入为owner
        TeamMember member = TeamMember.builder()
                .teamId(team.getId())
                .userId(userId)
                .userName(user.getName())
                .role(TeamMember.OWNER)
                .joinTime(LocalDateTime.now())
                .build();
        teamMemberMapper.addMember(member);

        return toTeamVO(team);
    }

    /**
     * 更新团队信息
     * @param dto
     */
    @Override
    @TeamAuth(TeamMember.ADMIN)
    public void updateTeam(UpdateTeamDTO dto) {
        //校验团队ID
        if (dto.getId() == null) {
            throw new InputException("团队ID不能为空");
        }
        Team team = Team.builder()
                .id(dto.getId())
                .name(dto.getName())
                .description(dto.getDescription())
                .build();
        teamMapper.updateTeam(team);
    }

    /**
     * 删除团队
     * @param id
     */
    @Override
    @Transactional
    @TeamAuth(TeamMember.OWNER)
    public void deleteTeam(Long id) {
        //校验团队ID
        if (id == null) {
            throw new InputException("团队ID不能为空");
        }
        Team team = teamMapper.getById(id);
        if (team == null) {
            throw new InputException(MessageConstant.NOT_FOUND);
        }
        //删除团队下所有成员
        List<TeamMember> members = teamMemberMapper.getMembersByTeamId(id);
        for (TeamMember member : members) {
            teamMemberMapper.deleteMember(member);
        }
        //删除团队
        teamMapper.deleteTeam(id);
    }

    /**
     * 邀请成员
     * @param dto
     */
    @Override
    @TeamAuth(TeamMember.ADMIN)
    public void inviteMember(AddTeamMemberDTO dto) {
        //校验用户存在
        User user = userMapper.getById(dto.getUserId());
        if (user == null) {
            throw new InputException(MessageConstant.ACCOUNT_NOT_FOUND);
        }

        //校验不在团队中
        TeamMember existing = teamMemberMapper.getByUserTeamId(dto.getUserId(), dto.getTeamId());
        if (existing != null) {
            throw new InputException(MessageConstant.ALREADY_EXIST);
        }

        TeamMember member = TeamMember.builder()
                .teamId(dto.getTeamId())
                .userId(dto.getUserId())
                .userName(user.getName())
                .role(dto.getRole())
                .joinTime(LocalDateTime.now())
                .build();
        teamMemberMapper.addMember(member);
    }

    /**
     * 移除成员
     * @param teamId
     * @param userId
     */
    @Override
    @TeamAuth(TeamMember.ADMIN)
    public void removeMember(Long teamId, Long userId) {
        //不能移除自己
        if (userId.equals(BaseContext.getCurrentId())) {
            throw new InputException("不能移除自己");
        }

        //不能移除owner
        TeamMember member = teamMemberMapper.getByUserTeamId(userId, teamId);
        if (member == null) {
            throw new InputException(MessageConstant.NOT_FOUND);
        }
        if (member.getRole() == TeamMember.OWNER) {
            throw new NoPermissionException("不能移除团队所有者");
        }

        TeamMember toRemove = TeamMember.builder()
                .teamId(teamId)
                .userId(userId)
                .build();
        teamMemberMapper.deleteMember(toRemove);
    }

    /**
     * 修改成员角色
     * @param dto
     */
    @Override
    @TeamAuth(TeamMember.OWNER)
    public void updateMemberRole(UpdateTeamMemberDTO dto) {
        //不能修改自己的角色
        if (dto.getUserId().equals(BaseContext.getCurrentId())) {
            throw new InputException("不能修改自己的角色");
        }

        TeamMember member = TeamMember.builder()
                .teamId(dto.getTeamId())
                .userId(dto.getUserId())
                .role(dto.getRole())
                .build();
        teamMemberMapper.updateRole(member);
    }

    /**
     * 查询团队下所有成员
     * @param teamId
     * @return
     */
    @Override
    public List<TeamMemberVO> listMembers(Long teamId) {
        //查询团队下所有成员
        List<TeamMember> members = teamMemberMapper.getMembersByTeamId(teamId);
        return members.stream().map(this::toMemberVO).collect(Collectors.toList());
    }

    /**
     * Entity转TeamVO
     * @param entity
     * @return
     */
    private TeamVO toTeamVO(Team entity) {
        return TeamVO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .createTime(entity.getCreateTime())
                .build();
    }

    /**
     * Entity转TeamMemberVO
     * @param entity
     * @return
     */
    private TeamMemberVO toMemberVO(TeamMember entity) {
        return TeamMemberVO.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .userName(entity.getUserName())
                .role(entity.getRole())
                .joinTime(entity.getJoinTime())
                .build();
    }
}
