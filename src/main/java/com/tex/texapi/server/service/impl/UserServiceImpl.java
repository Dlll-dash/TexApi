package com.tex.texapi.server.service.impl;

import com.tex.texapi.common.constant.JwtClaimsConstant;
import com.tex.texapi.common.constant.MessageConstant;
import com.tex.texapi.common.exception.LoginException;
import com.tex.texapi.common.properties.JwtProperties;
import com.tex.texapi.common.utils.JwtUtil;
import com.tex.texapi.pojo.dto.UserLoginDTO;
import com.tex.texapi.pojo.entity.User;
import com.tex.texapi.pojo.vo.UserLoginVO;
import com.tex.texapi.server.mapper.UserMapper;
import com.tex.texapi.server.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private JwtProperties jwtProperties;

    @Override
    public UserLoginVO login(UserLoginDTO userLoginDTO) {
        String username=userLoginDTO.getUserName();
        String password=userLoginDTO.getPassword();

        User user = userMapper.gerByUserName(username);
        if(user==null){
            //未查到用户
            throw new LoginException(MessageConstant.ACCOUNT_NOT_FOUND);
        }

        if(!DigestUtils.md5DigestAsHex(password.getBytes()).equals(user.getPassword())){
            //密码错误
            throw new LoginException(MessageConstant.PASSWORD_ERROR);
        }

        Map<String,Object>claims=new HashMap<>();
        claims.put(JwtClaimsConstant.USER_ID,user.getId());
        String token = JwtUtil.createJWT(jwtProperties.getSeretKey(), jwtProperties.getTtl(), claims);

        return UserLoginVO.builder()
                .id(user.getId())
                .name(user.getName())
                .userName(username)
                .token(token)
                .build();
    }
}
