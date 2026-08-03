package com.tex.texapi.server.controller;

import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.common.enumeration.CheckType;
import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.AddTeamDTO;
import com.tex.texapi.pojo.dto.AddTeamMemberDTO;
import com.tex.texapi.pojo.dto.DeleteTeamDTO;
import com.tex.texapi.pojo.dto.RemoveMemberDTO;
import com.tex.texapi.pojo.dto.UpdateTeamDTO;
import com.tex.texapi.pojo.dto.UpdateTeamMemberDTO;
import com.tex.texapi.pojo.entity.TeamMember;
import com.tex.texapi.pojo.vo.TeamMemberVO;
import com.tex.texapi.pojo.vo.TeamVO;
import com.tex.texapi.server.annotation.TeamAuth;
import com.tex.texapi.server.service.TeamService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tex/team")
@Slf4j
// 团队相关接口
public class TeamController {

    @Autowired
    private TeamService teamService;

    /**
     * 查询当前用户所在的团队列表
     * @return
     */
    @GetMapping("/list")
    public Result<List<TeamVO>> list() {
        log.info("查询当前用户的团队列表: {}", BaseContext.getCurrentId());
        List<TeamVO> list = teamService.listTeams();
        return Result.success(list);
    }

    /**
     * 创建团队
     * @param dto
     * @return
     */
    @PostMapping("/create")
    public Result<TeamVO> create(@RequestBody AddTeamDTO dto) {
        log.info("创建团队：{}", dto);
        TeamVO team = teamService.createTeam(dto);
        return Result.success(team);
    }

    /**
     * 更新团队信息
     * @param dto
     * @return
     */
    @PutMapping("/update")
    @TeamAuth(level = TeamMember.ADMIN)
    public Result update(@RequestBody UpdateTeamDTO dto) {
        log.info("更新团队：{}", dto);
        teamService.updateTeam(dto);
        return Result.success();
    }

    /**
     * 删除团队
     * @param id
     * @return
     */
    @DeleteMapping("/delete/{id}")
    @TeamAuth(level = TeamMember.OWNER)
    public Result delete(@PathVariable Long id) {
        log.info("删除团队：{}", id);
        DeleteTeamDTO dto = DeleteTeamDTO.builder().teamId(id).build();
        teamService.deleteTeam(dto);
        return Result.success();
    }

    /**
     * 邀请成员
     * @param id
     * @param dto
     * @return
     */
    @PostMapping("/{id}/invite")
    @TeamAuth(level = TeamMember.ADMIN)
    public Result invite(@PathVariable Long id, @RequestBody AddTeamMemberDTO dto) {
        log.info("邀请成员：teamId={}, userId={}", id, dto.getUserId());
        dto.setTeamId(id);
        teamService.inviteMember(dto);
        return Result.success();
    }

    /**
     * 移除成员
     * @param id
     * @param userId
     * @return
     */
    @DeleteMapping("/{id}/member/{userId}")
    @TeamAuth(level = TeamMember.ADMIN)
    public Result removeMember(@PathVariable Long id, @PathVariable Long userId) {
        log.info("移除成员：teamId={}, userId={}", id, userId);
        RemoveMemberDTO dto = RemoveMemberDTO.builder()
                .teamId(id)
                .userId(userId)
                .build();
        teamService.removeMember(dto);
        return Result.success();
    }

    /**
     * 修改成员角色
     * @param id
     * @param userId
     * @param dto
     * @return
     */
    @PutMapping("/{id}/member/{userId}")
    @TeamAuth(level = TeamMember.OWNER)
    public Result updateMemberRole(@PathVariable Long id, @PathVariable Long userId,
                                   @RequestBody UpdateTeamMemberDTO dto) {
        log.info("修改成员角色：teamId={}, userId={}, role={}", id, userId, dto.getRole());
        dto.setTeamId(id);
        dto.setUserId(userId);
        teamService.updateMemberRole(dto);
        return Result.success();
    }

    /**
     * 查询团队下所有成员
     * @param id
     * @return
     */
    @GetMapping("/{id}/members")
    @TeamAuth(level = TeamMember.VIEWER, checkType = CheckType.TEAM)
    public Result<List<TeamMemberVO>> members(@PathVariable Long id) {
        log.info("查询团队成员列表：teamId={}", id);
        List<TeamMemberVO> list = teamService.listMembers(id);
        return Result.success(list);
    }
}
