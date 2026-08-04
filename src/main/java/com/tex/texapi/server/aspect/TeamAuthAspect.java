package com.tex.texapi.server.aspect;

import com.tex.texapi.common.constant.MessageConstant;
import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.common.enumeration.CheckType;
import com.tex.texapi.common.exception.NoPermissionException;
import com.tex.texapi.pojo.entity.TeamMember;
import com.tex.texapi.server.annotation.TeamAuth;
import com.tex.texapi.server.mapper.ApiMapper;
import com.tex.texapi.server.mapper.CategoryMapper;
import com.tex.texapi.server.mapper.ProjectMapper;
import com.tex.texapi.server.mapper.RequestParamsMapper;
import com.tex.texapi.server.mapper.ResponseMapper;
import com.tex.texapi.server.mapper.TeamMemberMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

// 团队鉴权切面
@Aspect
@Component
@Slf4j
public class TeamAuthAspect {

    // 切面加载确认
    @PostConstruct
    public void init() {
        log.info("TeamAuthAspect 切面已加载，开始拦截 @TeamAuth 注解方法");
    }
    @Autowired
    TeamMemberMapper teamMemberMapper;
    @Autowired
    ProjectMapper projectMapper;
    @Autowired
    ApiMapper apiMapper;
    @Autowired
    CategoryMapper categoryMapper;
    @Autowired
    RequestParamsMapper requestParamsMapper;
    @Autowired
    ResponseMapper responseMapper;

    @Pointcut("execution(* com.tex.texapi.server.controller.*.*(..)) && @annotation(com.tex.texapi.server.annotation.TeamAuth)")
    public void teamAuthPointcut() {
    }

    @Before("teamAuthPointcut()")
    public void beforeTeamAuth(JoinPoint joinPoint) {
        Long userId = BaseContext.getCurrentId();

        MethodSignature methodSignature = (MethodSignature) joinPoint.getSignature();
        TeamAuth teamAuth = methodSignature.getMethod().getAnnotation(TeamAuth.class);
        int requiredLevel = teamAuth.level();
        CheckType checkType = teamAuth.checkType();

        // 从方法参数中提取 resourceId
        Long resourceId = extractResourceId(joinPoint, checkType);

        // 一条 SQL 完成鉴权：JOIN 走完归属链 + 查角色
        Integer role = getUserRole(checkType, resourceId, userId);

        String methodName = joinPoint.getTarget().getClass().getSimpleName()
                + "." + methodSignature.getMethod().getName();
        log.info("鉴权 {} — userId={}, resourceId={}, checkType={}, requiredLevel={}, role={}",
                methodName, userId, resourceId, checkType, requiredLevel, role);

        if (role == null) {
            throw new NoPermissionException(MessageConstant.NOT_TEAM_MEMBER);
        }
        if (role < requiredLevel) {
            throw new NoPermissionException(MessageConstant.PERMISSION_DENIED);
        }
    }

    /**
     * 一条 SQL：按资源类型 JOIN 归属链，返回用户在目标团队中的角色，无权限返回 null
     */
    private Integer getUserRole(CheckType checkType, Long resourceId, Long userId) {
        switch (checkType) {
            case TEAM: {
                TeamMember member = teamMemberMapper.getByUserTeamId(userId, resourceId);
                return member != null ? member.getRole() : null;
            }
            case PROJECT:
                return projectMapper.getUserRole(resourceId, userId);
            case API:
                return apiMapper.getUserRole(resourceId, userId);
            case CATEGORY:
                return categoryMapper.getUserRole(resourceId, userId);
            case PARAM:
                return requestParamsMapper.getUserRole(resourceId, userId);
            case RESPONSE:
                return responseMapper.getUserRole(resourceId, userId);
            default:
                throw new IllegalStateException("不支持的 CheckType: " + checkType);
        }
    }

    /**
     * 提取 resourceId，优先级：
     * 1. getId()
     * 2. get{CheckType}Id()（如 getProjectId、getApiId）
     * 3. 第一个 Long 参数
     */
    private Long extractResourceId(JoinPoint joinPoint, CheckType checkType) {
        Object[] args = joinPoint.getArgs();
        String checkTypeGetter = "get" + checkType.name().charAt(0)
                + checkType.name().substring(1).toLowerCase() + "Id";

        // 优先级 1: getId()（跳过返回 null 的，如新建对象）
        for (Object arg : args) {
            if (arg == null) continue;
            try {
                Long id = (Long) arg.getClass().getMethod("getId").invoke(arg);
                if (id != null) return id;
            } catch (NoSuchMethodException e) {
                // 继续
            } catch (Exception e) {
                throw new RuntimeException("调用 getId() 失败", e);
            }
        }

        // 优先级 2: get{CheckType}Id()（如 getProjectId、getApiId、getTeamId）
        for (Object arg : args) {
            if (arg == null) continue;
            try {
                Method getter = arg.getClass().getMethod(checkTypeGetter);
                Long id = (Long) getter.invoke(arg);
                if (id != null) return id;
            } catch (NoSuchMethodException e) {
                // 继续
            } catch (Exception e) {
                throw new RuntimeException("调用 " + checkTypeGetter + "() 失败", e);
            }
        }

        // 优先级 3: 第一个 Long 参数
        for (Object arg : args) {
            if (arg instanceof Long) {
                return (Long) arg;
            }
        }

        throw new IllegalStateException(
                "@TeamAuth 方法参数中找不到 resourceId（checkType=" + checkType + "）");
    }
}
