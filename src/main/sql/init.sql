CREATE SCHEMA IF NOT EXISTS `tex_api` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
-- 先创建数据库（如果没创建）
CREATE DATABASE IF NOT EXISTS tex_api DEFAULT CHARSET utf8mb4;
USE tex_api;

-- 项目表
CREATE TABLE `project` (
                           `id` bigint NOT NULL AUTO_INCREMENT COMMENT '项目ID',
                           `name` varchar(100) NOT NULL COMMENT '项目名称',
                           `description` varchar(500) DEFAULT '' COMMENT '项目描述',
                           `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
                           PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 接口表
CREATE TABLE `api` (
                       `id` bigint NOT NULL AUTO_INCREMENT COMMENT '接口ID',
                       `project_id` bigint NOT NULL COMMENT '所属项目ID',
                       `api_name` varchar(100) NOT NULL COMMENT '接口名称',
                       `request_url` varchar(500) NOT NULL COMMENT '请求地址',
                       `request_method` varchar(10) NOT NULL COMMENT '请求方式 GET/POST/PUT/DELETE',
                       `request_header` text COMMENT '请求头（JSON格式）',
                       `request_param` text COMMENT '请求参数（JSON格式）',
                       `response_example` text COMMENT '响应示例（JSON格式）',
                       `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
                       PRIMARY KEY (`id`),
                       KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;