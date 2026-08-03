package com.tex.texapi.server.controller;

import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.UserLoginDTO;
import com.tex.texapi.pojo.dto.UserRegistryDTO;
import com.tex.texapi.pojo.vo.UserLoginVO;
import com.tex.texapi.pojo.vo.UserProfileVO;
import com.tex.texapi.server.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tex/user")
@Slf4j
// 用户相关接口
public class UserController {
    @Autowired
    private UserService userService;

    /**
     * 用户登录
     * @param userLoginDTO
     * @return
     */
    @PostMapping("/login")
    public Result<UserLoginVO> login(@RequestBody UserLoginDTO userLoginDTO){
        log.info("用户登录：{}",userLoginDTO);
        UserLoginVO userLoginVO = userService.login(userLoginDTO);
        return Result.success(userLoginVO);
    }

    /**
     * 用户注册
     * @param userRegistryDTO
     * @return
     */
    @PostMapping("/register")
    public Result register(@RequestBody UserRegistryDTO userRegistryDTO){
        log.info("用户注册：{}",userRegistryDTO);
        userService.register(userRegistryDTO);
        return Result.success();
    }

    /**
     * 获取当前用户信息
     * @return
     */
    @GetMapping("/profile")
    public Result<UserProfileVO> profile() {
        log.info("获取当前用户信息");
        UserProfileVO profile = userService.getProfile();
        return Result.success(profile);
    }
}
