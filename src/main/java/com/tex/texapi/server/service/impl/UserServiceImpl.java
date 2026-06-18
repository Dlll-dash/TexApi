package com.tex.texapi.server.service.impl;

import com.tex.texapi.common.constant.JwtClaimsConstant;
import com.tex.texapi.common.constant.MessageConstant;
import com.tex.texapi.common.exception.LoginException;
import com.tex.texapi.common.properties.JwtProperties;
import com.tex.texapi.common.utils.JwtUtil;
import com.tex.texapi.pojo.dto.UserLoginDTO;
import com.tex.texapi.pojo.dto.UserRegistryDTO;
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

    @Override
    public void register(UserRegistryDTO userRegistryDTO) {
        userRegistryDTO.setPassword(DigestUtils.md5DigestAsHex(userRegistryDTO.getPassword().getBytes()));
        User user=userMapper.gerByUserName(userRegistryDTO.getUserName());
        if(user!=null){
            //用户名已存在
            throw new LoginException(MessageConstant.ACCOUNT_EXIST);
        }
        if(userRegistryDTO.getName()==null||userRegistryDTO.getName().isEmpty()){
            //姓名不能为空
            throw new LoginException(MessageConstant.NAME_EMPTY);
        }else if(userRegistryDTO.getPassword()==null||userRegistryDTO.getPassword().isEmpty()){
            //密码不能为空
            throw new LoginException(MessageConstant.PASSWORD_EMPTY);
        }else if(userRegistryDTO.getUserName()==null||userRegistryDTO.getUserName().isEmpty()){
            //用户名不能为空
            throw new LoginException(MessageConstant.USERNAME_EMPTY);
        }else if(userRegistryDTO.getEmail()==null||userRegistryDTO.getEmail().isEmpty()){
            //邮箱不能为空
            throw new LoginException(MessageConstant.EMAIL_EMPTY);
        }
        userMapper.register(userRegistryDTO);
    }
}
