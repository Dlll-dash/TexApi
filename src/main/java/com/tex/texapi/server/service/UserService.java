package com.tex.texapi.server.service;

import com.tex.texapi.pojo.dto.UserLoginDTO;
import com.tex.texapi.pojo.dto.UserRegistryDTO;
import com.tex.texapi.pojo.vo.UserLoginVO;
import com.tex.texapi.pojo.vo.UserProfileVO;

public interface UserService {
    /**
     * 用户登录
     * @param userLoginDTO
     */
    UserLoginVO login(UserLoginDTO userLoginDTO);

    /**
     * 用户注册
     * @param userRegistryDTO
     */
    void register(UserRegistryDTO userRegistryDTO);

    /**
     * 获取当前用户信息
     * @return
     */
    UserProfileVO getProfile();
}
