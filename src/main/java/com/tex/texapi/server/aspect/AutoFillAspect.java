package com.tex.texapi.server.aspect;
import com.tex.texapi.common.constant.AutoFillConstant;
import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.common.enumeration.OperationType;
import com.tex.texapi.server.annotation.AutoFill;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.Signature;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Aspect
@Component
@Slf4j
public class AutoFillAspect {

    /**
     * 切入点
     */
    @Pointcut("execution(* com.tex.texapi.server.mapper.*.*(..))&& @annotation(com.tex.texapi.server.annotation.AutoFill)")
    public void autoFillPointCut() {
    }

    //前置通知，在执行数据库操作之前进行自动填充
    @Before("autoFillPointCut()")
    public void autoFill(JoinPoint joinPoint) throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        log.info("开始进行公共字段自动填充...");
        // 获取拦截的数据库操作类型
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        AutoFill autoFill= signature.getMethod().getAnnotation(AutoFill.class);
        OperationType operationType = autoFill.value();

        //获取方法参数
        Object args[]= joinPoint.getArgs();
        if(args==null||args.length==0){
            return ;
        }
        Object entity=args[0];

        //准备填充的数据
        LocalDateTime now= LocalDateTime.now();
        Long id= BaseContext.getCurrentId();

        // 根据操作类型进行不同的自动填充逻辑
        if (operationType == OperationType.INSERT) {
            //获得方法对象
            Method setCreateTime = entity.getClass().getDeclaredMethod(AutoFillConstant.SET_CREATE_TIME, LocalDateTime.class);
            Method setCreateUser = entity.getClass().getDeclaredMethod(AutoFillConstant.SET_CREATE_USER, Long.class);
            Method setUpdateTime = entity.getClass().getDeclaredMethod(AutoFillConstant.SET_UPDATE_TIME, LocalDateTime.class);
            Method setUpdateUser = entity.getClass().getDeclaredMethod(AutoFillConstant.SET_UPDATE_USER, Long.class);

            //调用方法进行自动填充
            setCreateTime.invoke(entity, now);
            setCreateUser.invoke(entity, id);
            setUpdateTime.invoke(entity, now);
            setUpdateUser.invoke(entity, id);

        }else if (operationType == OperationType.UPDATE) {
            Method setUpdateTime = entity.getClass().getDeclaredMethod(AutoFillConstant.SET_UPDATE_TIME, LocalDateTime.class);
            Method setUpdateUser = entity.getClass().getDeclaredMethod(AutoFillConstant.SET_UPDATE_USER, Long.class);

            setUpdateTime.invoke(entity, now);
            setUpdateUser.invoke(entity, id);
        }


    }
}
