package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface UserMapper {

    /**
     * 根据账号查询
     * @param userName
     * @return
     */
    @Select("select * from user where user_name=#{userName}")
    User getByUserName(String userName);

    /**
     * 注册
     * @param user
     */
    void register(User user);

    /**
     * 根据id查询用户
     * @param id
     * @return
     */
    @Select("select * from user where id=#{id}")
    User getById(Long id);

    /**
     * 根据uuid查询用户
     * @param uuid
     * @return
     */
    @Select("select * from user where uuid=#{uuid}")
    User getByUuid(String uuid);

    /**
     * 搜索用户（按用户名、姓名或邮箱模糊匹配）
     * @param keyword 搜索关键词
     * @return 匹配的用户列表（最多20条）
     */
    List<User> searchByKeyword(String keyword);

    /**
     * 批量查询用户（只查id和uuid）
     * @param ids 用户ID列表
     * @return 用户列表（仅id和uuid字段有值）
     */
    List<User> listByIds(List<Long> ids);

}
