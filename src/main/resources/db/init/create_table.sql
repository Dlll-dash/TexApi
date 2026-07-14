create table api
(
    id             bigint auto_increment comment '接口ID'
        primary key,
    project_id     bigint                             not null comment '所属项目ID',
    api_name       varchar(100)                       not null comment '接口名称',
    request_url    varchar(500)                       null comment '请求地址',
    request_method varchar(10)                        not null comment '请求方式 GET/POST/PUT/DELETE',
    create_time    datetime default CURRENT_TIMESTAMP null,
    create_user    bigint                             null comment '创建人',
    status         int                                not null comment '接口状态（0 维护中   1 开发中   2 已发布）',
    explanation    varchar(200)                       null,
    in_charge_user varchar(100)                       null,
    update_time    datetime                           null comment '修改时间',
    update_user    bigint                             null comment '修改人id',
    category_id    bigint                             not null comment '所属分类id'
)
    charset = utf8mb4;

create index idx_project_id
    on api (project_id);

create table category
(
    id         bigint auto_increment comment '分类主键'
        primary key,
    project_id bigint       not null comment '所属项目id',
    name       varchar(100) null comment '分类名',
    parent_id  bigint       null comment '父节点分类id (0 表示无父节点 )'
)
    comment '接口分类表';

create index category_parent_id_index
    on category (parent_id)
    comment '父分类id索引';

create table project
(
    id          bigint auto_increment comment '项目ID'
        primary key,
    name        varchar(100)                           not null comment '项目名称',
    description varchar(500) default ''                null comment '项目描述',
    create_time datetime     default CURRENT_TIMESTAMP null,
    create_user bigint                                 null comment '创建人id'
)
    charset = utf8mb4;

create table project_user
(
    project_id bigint not null comment '项目id',
    user_id    bigint not null comment '用户id',
    primary key (user_id, project_id)
)
    comment '项目与用户关联表';

create table request_params
(
    id           bigint auto_increment
        primary key,
    name         varchar(50)  not null comment '参数名',
    value        varchar(200) null comment '参数值',
    type         varchar(20)  null comment '参数值类型',
    explanation  varchar(50)  null comment '说明',
    api_id       bigint       not null comment '所属接口id',
    format_type  varchar(20)  not null comment '格式类型(query，formData，urlencoded，json，header)',
    is_necessary tinyint(1)   null comment '是否必须',
    is_checked   tinyint(1)   null comment '是否被选中'
)
    comment 'Query请求参数表';

create table response
(
    id            bigint auto_increment comment '主键'
        primary key,
    name          varchar(50)   not null comment '名称',
    response_code varchar(200)  not null comment 'HTTP 状态码',
    content_type  varchar(50)   not null comment '内容格式',
    response_body varchar(2048) null comment '响应Body',
    api_id        bigint        not null comment '所属接口id'
)
    comment '响应参数表';

create table user
(
    id        bigint auto_increment comment '用户id'
        primary key,
    name      varchar(50) not null comment '姓名',
    user_name varchar(50) not null comment '用户名',
    password  varchar(64) not null comment '密码',
    gender    varchar(2)  null comment '性别',
    phone     varchar(11) null comment '电话号码',
    email     varchar(50) not null comment '邮箱'
)
    comment '用户表';


