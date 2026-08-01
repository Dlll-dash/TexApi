package com.tex.texapi.server.aspect;

import com.tex.texapi.common.constant.MessageConstant;
import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.common.exception.NoPermissionException;
import com.tex.texapi.pojo.entity.TeamMember;
import com.tex.texapi.server.annotation.TeamAuth;
import com.tex.texapi.server.mapper.TeamMemberMapper;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class TeamAuthAspect {
    @Autowired
    TeamMemberMapper teamMemberMapper;

    @Pointcut("execution(* com.tex.texapi.server.service.impl.*(..))&& @annotation(com.tex.texapi.server.annotation.TeamAuth)")
    public void teamAuthPointcut() {
    }

    //前置通知：在方法执行前，进行团队鉴权检查
    @Before("teamAuthPointcut()")
    public void beforeTeamAuth(JoinPoint joinPoint) {
        Long userId= BaseContext.getCurrentId();
        Long teamId=BaseContext.getCurrentTeamId();
        log.info("进行团队鉴权检查: userId={}, teamId={}", userId, teamId);

        //获取拦截的团队操作类型
        MethodSignature methodSignature = (MethodSignature) joinPoint.getSignature();
        TeamAuth teamAuth = methodSignature.getMethod().getAnnotation(TeamAuth.class);
        int operationLevel = teamAuth.value();

        //获取用户权限等级
        int role=getRole(userId,teamId);
        log.info("用户权限等级: {}", role);

        //根据权限等级和操作类型进行鉴权
        if (role < operationLevel) {
            throw new NoPermissionException(MessageConstant.PERMISSION_DENIED);
        }

    }

    private int getRole(Long userId,Long teamId) {
        //根据用户id获取用户权限等级
        TeamMember member = teamMemberMapper.getByUserTeamId(userId,teamId);
        if(member==null){
            //不是团队成员
            throw new NoPermissionException(MessageConstant.NOT_TEAM_MEMBER);
        }
        return member.getRole();
    }
}
