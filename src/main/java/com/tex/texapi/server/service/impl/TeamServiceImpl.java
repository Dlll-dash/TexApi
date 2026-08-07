package com.tex.texapi.server.service.impl;

import com.tex.texapi.common.constant.MessageConstant;
import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.common.exception.InputException;
import com.tex.texapi.common.exception.NoPermissionException;
import com.tex.texapi.pojo.dto.AddTeamDTO;
import com.tex.texapi.pojo.dto.AddTeamMemberDTO;
import com.tex.texapi.pojo.dto.DeleteTeamDTO;
import com.tex.texapi.pojo.dto.RemoveMemberDTO;
import com.tex.texapi.pojo.dto.UpdateTeamDTO;
import com.tex.texapi.pojo.dto.UpdateTeamMemberDTO;
import com.tex.texapi.pojo.entity.Team;
import com.tex.texapi.pojo.entity.TeamMember;
import com.tex.texapi.pojo.entity.User;
import com.tex.texapi.pojo.vo.TeamMemberVO;
import com.tex.texapi.pojo.vo.TeamVO;
import com.tex.texapi.pojo.entity.Project;
import com.tex.texapi.server.mapper.ApiMapper;
import com.tex.texapi.server.mapper.CategoryMapper;
import com.tex.texapi.server.mapper.ProjectMapper;
import com.tex.texapi.server.mapper.RequestParamsMapper;
import com.tex.texapi.server.mapper.ResponseMapper;
import com.tex.texapi.server.mapper.TeamMapper;
import com.tex.texapi.server.mapper.TeamMemberMapper;
import com.tex.texapi.server.mapper.UserMapper;
import com.tex.texapi.server.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static java.util.stream.Collectors.toMap;

@Service
public class TeamServiceImpl implements TeamService {

    @Autowired
    private TeamMapper teamMapper;
    @Autowired
    private TeamMemberMapper teamMemberMapper;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private ProjectMapper projectMapper;
    @Autowired
    private CategoryMapper categoryMapper;
    @Autowired
    private ApiMapper apiMapper;
    @Autowired
    private RequestParamsMapper requestParamsMapper;
    @Autowired
    private ResponseMapper responseMapper;

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
     * @param dto
     */
    @Override
    @Transactional
    public void deleteTeam(DeleteTeamDTO dto) {
        Long teamId = dto.getTeamId();
        if (teamId == null) {
            throw new InputException("团队ID不能为空");
        }
        Team team = teamMapper.getById(teamId);
        if (team == null) {
            throw new InputException(MessageConstant.NOT_FOUND);
        }
        //1. 获取团队下所有项目
        List<Project> projects = projectMapper.getProjectList(teamId);
        if (!projects.isEmpty()) {
            List<Long> projectIds = projects.stream().map(Project::getId).toList();

            //2. 获取项目下分类ID + 接口ID（直接挂在项目下的）
            List<Long> categoryIds = categoryMapper.getIdsByProjectIds(projectIds);
            List<Long> apiIdsFromProject = apiMapper.getIdsByProjectIds(projectIds);

            //3. 获取分类下接口ID，合并去重
            List<Long> apiIdsFromCategory = categoryIds.isEmpty()
                    ? List.of() : apiMapper.getIdsByCategoryIds(categoryIds);
            List<Long> allApiIds = Stream.concat(
                    apiIdsFromProject.stream(), apiIdsFromCategory.stream()
            ).distinct().toList();

            //4. 删除接口下的参数和响应
            if (!allApiIds.isEmpty()) {
                requestParamsMapper.deleteBatchByApiIds(allApiIds);
                responseMapper.deleteBatchByApiIds(allApiIds);
            }

            //5. 删除接口（分类下 + 全部ID兜底）
            if (!categoryIds.isEmpty()) {
                apiMapper.deleteBatchByCategoryId(categoryIds);
            }
            apiMapper.deleteBatchByIds(allApiIds);

            //6. 删除分类
            categoryMapper.deleteByProjectIds(projectIds);

            //7. 删除项目
            projectMapper.deleteByTeamId(teamId);
        }

        //8. 删除团队成员
        List<TeamMember> members = teamMemberMapper.getMembersByTeamId(teamId);
        for (TeamMember member : members) {
            teamMemberMapper.deleteMember(member);
        }

        //9. 删除团队
        teamMapper.deleteTeam(teamId);
    }

    /**
     * 邀请成员
     * @param dto
     */
    @Override
    public void inviteMember(AddTeamMemberDTO dto) {
        //通过uuid或id解析用户（uuid优先）
        User user = resolveUser(dto.getUserUuid(), dto.getUserId());
        if (user == null) {
            throw new InputException(MessageConstant.ACCOUNT_NOT_FOUND);
        }

        Long userId = user.getId();

        //校验不在团队中
        TeamMember existing = teamMemberMapper.getByUserTeamId(userId, dto.getTeamId());
        if (existing != null) {
            throw new InputException(MessageConstant.ALREADY_EXIST);
        }

        TeamMember member = TeamMember.builder()
                .teamId(dto.getTeamId())
                .userId(userId)
                .userName(user.getName())
                .role(dto.getRole())
                .joinTime(LocalDateTime.now())
                .build();
        teamMemberMapper.addMember(member);
    }

    /**
     * 移除成员
     * @param dto
     */
    @Override
    public void removeMember(RemoveMemberDTO dto) {
        Long teamId = dto.getTeamId();
        //通过uuid或id解析用户
        User user = resolveUser(dto.getUserUuid(), dto.getUserId());
        if (user == null) {
            throw new InputException(MessageConstant.ACCOUNT_NOT_FOUND);
        }
        Long userId = user.getId();

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
     *
     * 规则：
     * - 一个团队只能有一个 owner
     * - owner 可调整任意成员角色；设为 owner 时触发所有权转让（自己降为 admin）
     * - admin 只能将 viewer/editor 互转，不能提升到 admin 或 owner
     *
     * @param dto
     */
    @Override
    @Transactional
    public void updateMemberRole(UpdateTeamMemberDTO dto) {
        //通过uuid或id解析目标用户
        User targetUser = resolveUser(dto.getUserUuid(), dto.getUserId());
        if (targetUser == null) {
            throw new InputException(MessageConstant.ACCOUNT_NOT_FOUND);
        }
        Long targetUserId = targetUser.getId();

        //不能修改自己的角色
        if (targetUserId.equals(BaseContext.getCurrentId())) {
            throw new InputException("不能修改自己的角色");
        }

        Long teamId = dto.getTeamId();
        int newRole = dto.getRole();

        //查出当前用户和目标用户在团队中的角色
        Long currentUserId = BaseContext.getCurrentId();
        TeamMember currentMember = teamMemberMapper.getByUserTeamId(currentUserId, teamId);
        TeamMember targetMember = teamMemberMapper.getByUserTeamId(targetUserId, teamId);
        if (targetMember == null) {
            throw new InputException(MessageConstant.NOT_FOUND);
        }

        int myRole = currentMember.getRole();
        int targetCurrentRole = targetMember.getRole();

        if (myRole == TeamMember.OWNER) {
            if (newRole == TeamMember.OWNER) {
                //所有权转让：目标 → owner，自己 → admin
                TeamMember toOwner = TeamMember.builder()
                        .teamId(teamId).userId(targetUserId).role(TeamMember.OWNER).build();
                TeamMember toAdmin = TeamMember.builder()
                        .teamId(teamId).userId(currentUserId).role(TeamMember.ADMIN).build();
                teamMemberMapper.updateRole(toOwner);
                teamMemberMapper.updateRole(toAdmin);
                return;
            }
            //owner 设置其他角色（1-3）：正常更新
            TeamMember member = TeamMember.builder()
                    .teamId(teamId).userId(targetUserId).role(newRole).build();
            teamMemberMapper.updateRole(member);
            return;
        }

        if (myRole == TeamMember.ADMIN) {
            //admin 只能将 viewer/editor 互转
            if (newRole != TeamMember.VIEWER && newRole != TeamMember.EDITOR) {
                throw new NoPermissionException("admin 只能将成员设为 viewer 或 editor");
            }
            if (targetCurrentRole != TeamMember.VIEWER && targetCurrentRole != TeamMember.EDITOR) {
                throw new NoPermissionException("不能修改 admin 或 owner 的角色");
            }
            TeamMember member = TeamMember.builder()
                    .teamId(teamId).userId(targetUserId).role(newRole).build();
            teamMemberMapper.updateRole(member);
            return;
        }

        throw new NoPermissionException("无权限修改成员角色");
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

        //批量加载用户uuid（遵循CRUD规范：一次IN查询，避免N+1）
        List<Long> userIds = members.stream().map(TeamMember::getUserId).distinct().toList();
        Map<Long, String> uuidMap = userIds.isEmpty() ? Map.of() :
                userMapper.listByIds(userIds).stream()
                        .collect(toMap(User::getId, User::getUuid));

        return members.stream()
                .map(m -> toMemberVO(m, uuidMap.get(m.getUserId())))
                .collect(Collectors.toList());
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
                .createUser(entity.getCreateUser())
                .createTime(entity.getCreateTime())
                .build();
    }

    /**
     * Entity转TeamMemberVO
     * @param entity
     * @param userUuid 对应用户的uuid
     * @return
     */
    private TeamMemberVO toMemberVO(TeamMember entity, String userUuid) {
        return TeamMemberVO.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .userUuid(userUuid)
                .userName(entity.getUserName())
                .role(entity.getRole())
                .joinTime(entity.getJoinTime())
                .build();
    }

    /**
     * 通过uuid或id解析用户（uuid优先）
     * @param userUuid 用户uuid（可为null）
     * @param userId 用户id（可为null，旧版兼容）
     * @return 用户实体，找不到返回null
     */
    private User resolveUser(String userUuid, Long userId) {
        if (userUuid != null && !userUuid.isBlank()) {
            return userMapper.getByUuid(userUuid);
        }
        if (userId != null) {
            return userMapper.getById(userId);
        }
        return null;
    }
}
