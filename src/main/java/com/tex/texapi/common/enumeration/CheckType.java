package com.tex.texapi.common.enumeration;

/**
 * 资源类型，供 @TeamAuth 切面确定鉴权解析链
 */
public enum CheckType {
    /** 团队级：从参数 getTeamId() 提取，直接使用 */
    TEAM,
    /** 项目级：projectId → project.teamId */
    PROJECT,
    /** 接口级：apiId → api.projectId → project.teamId */
    API,
    /** 分类级：categoryId → category.projectId → project.teamId */
    CATEGORY,
    /** 请求参数级：paramId → param.apiId → api.projectId → project.teamId */
    PARAM,
    /** 响应级：responseId → response.apiId → api.projectId → project.teamId */
    RESPONSE
}
