package com.tex.texapi.server.annotation;

import com.tex.texapi.common.enumeration.CheckType;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

//团队鉴权注释
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface TeamAuth {
    //需要的权限等级
    int level();

    //资源类型，默认为TEAM（兼容已有用法）
    CheckType checkType() default CheckType.TEAM;
}
