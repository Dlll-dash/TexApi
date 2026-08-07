package com.tex.texapi.server.service;

import com.tex.texapi.pojo.dto.UserLoginDTO;
import com.tex.texapi.pojo.dto.UserRegistryDTO;
import com.tex.texapi.pojo.vo.UserLoginVO;
import com.tex.texapi.pojo.vo.UserProfileVO;
import com.tex.texapi.pojo.vo.UserSearchResultVO;

import java.util.List;

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

    /**
     * 搜索用户（按用户名、姓名或邮箱模糊匹配）
     * @param keyword 搜索关键词（至少2个字符）
     * @return 匹配的用户列表（最多20条）
     */
    List<UserSearchResultVO> searchUsers(String keyword);
}
