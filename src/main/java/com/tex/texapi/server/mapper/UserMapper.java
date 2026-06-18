package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.dto.UserRegistryDTO;
import com.tex.texapi.pojo.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserMapper {

    @Select("select * from user where user_name=#{userName}")
    User gerByUserName(String userName);

    void register(UserRegistryDTO userRegistryDTO);
}
