package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.dto.UserRegistryDTO;
import com.tex.texapi.pojo.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

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


}
