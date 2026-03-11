package com.tex.texapi.server.service;

import com.tex.texapi.pojo.dto.UserLoginDTO;
import com.tex.texapi.pojo.vo.UserLoginVO;

public interface UserService {
    /**
     * 用户登录
     * @param userLoginDTO
     */
    UserLoginVO login(UserLoginDTO userLoginDTO);
}
