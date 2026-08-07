package com.tex.texapi.server.service.impl;

import com.tex.texapi.common.constant.JwtClaimsConstant;
import com.tex.texapi.common.constant.MessageConstant;
import com.tex.texapi.common.exception.InputException;
import com.tex.texapi.common.exception.LoginException;
import com.tex.texapi.common.properties.JwtProperties;
import com.tex.texapi.common.utils.JwtUtil;
import com.tex.texapi.pojo.dto.UserLoginDTO;
import com.tex.texapi.pojo.dto.UserRegistryDTO;
import com.tex.texapi.pojo.entity.Team;
import com.tex.texapi.pojo.entity.TeamMember;
import com.tex.texapi.pojo.entity.User;
import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.pojo.vo.UserLoginVO;
import com.tex.texapi.pojo.vo.UserProfileVO;
import com.tex.texapi.pojo.vo.UserSearchResultVO;
import com.tex.texapi.server.mapper.TeamMapper;
import com.tex.texapi.server.mapper.TeamMemberMapper;
import com.tex.texapi.server.mapper.UserMapper;
import com.tex.texapi.server.service.UserService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private JwtProperties jwtProperties;
    @Autowired
    private TeamMapper teamMapper;
    @Autowired
    private TeamMemberMapper teamMemberMapper;

    @Override
    public UserLoginVO login(UserLoginDTO userLoginDTO) {
        String username=userLoginDTO.getUserName();
        String password=userLoginDTO.getPassword();

        User user = userMapper.getByUserName(username);
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
                .uuid(user.getUuid())
                .name(user.getName())
                .userName(username)
                .token(token)
                .build();
    }

    @Override
    @Transactional
    public void register(UserRegistryDTO userRegistryDTO) {
        userRegistryDTO.setPassword(DigestUtils.md5DigestAsHex(userRegistryDTO.getPassword().getBytes()));

        User user=userMapper.getByUserName(userRegistryDTO.getUserName());
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

        user=new User();
        BeanUtils.copyProperties(userRegistryDTO,user);
        user.setUuid(java.util.UUID.randomUUID().toString());
        userMapper.register(user);

        //自动创建个人团队
        Team team=Team.builder()
                .name("个人团队")
                .createTime(LocalDateTime.now())
                .createUser(user.getId())
                .build();

        teamMapper.addTeam(team);

        TeamMember member=TeamMember.builder()
                .teamId(team.getId())
                .userId(user.getId())
                .userName(user.getName())
                .role(TeamMember.OWNER)
                .joinTime(LocalDateTime.now())
                .build();
        teamMemberMapper.addMember(member);

    }

    /**
     * 获取当前用户信息
     * @return
     */
    @Override
    public UserProfileVO getProfile() {
        Long userId = BaseContext.getCurrentId();
        User user = userMapper.getById(userId);
        return UserProfileVO.builder()
                .id(user.getId())
                .uuid(user.getUuid())
                .name(user.getName())
                .userName(user.getUserName())
                .gender(user.getGender())
                .phone(user.getPhone())
                .email(user.getEmail())
                .build();
    }

    /**
     * 搜索用户
     * @param keyword 搜索关键词
     * @return
     */
    @Override
    public List<UserSearchResultVO> searchUsers(String keyword) {
        if (keyword == null || keyword.trim().length() < 2) {
            throw new InputException("搜索关键词至少需要2个字符");
        }
        List<User> users = userMapper.searchByKeyword(keyword.trim());
        return users.stream()
                .map(u -> UserSearchResultVO.builder()
                        .uuid(u.getUuid())
                        .userName(u.getUserName())
                        .name(u.getName())
                        .email(u.getEmail())
                        .build())
                .collect(Collectors.toList());
    }
}
