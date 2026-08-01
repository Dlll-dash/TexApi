# TexApi CRUD 编码规范

本文档定义 TexApi 项目 CRUD 功能的标准分层规范，适用于新增任何模块。所有代码风格严格参照 `Project` 模块。

---

## 架构分层

```
Controller  →  DTO/VO（入参/返参，绝不出现 Entity）
Service     →  DTO/VO ↔ Entity 转换（接口入参DTO、返参VO）
Mapper      →  Entity（只跟数据库表映射的实体打交道）
```

**Entity 不出 Controller 层，也不进 Controller 层。**

---

## 注释规范

**所有新建文件必须写注释**，参照现有代码风格：

### POJO 字段：行内 `//`

```java
//主键
Long id;
//团队名
String name;
```

### 接口/抽象方法：Javadoc

```java
/**
 * 中文描述
 * @param xxx 参数说明
 * @return 返回值说明
 */
```

- 方法必须有 `/** 中文描述 */`
- 有参数必有 `@param`
- 有返回值必有 `@return`
- void 方法不写 `@return`

### ServiceImpl：Javadoc + 行内注释

```java
/**
 * 创建团队
 * @param dto
 */
@Override
@Transactional
public void createTeam(AddTeamDTO dto) {
    //校验团队名
    if (dto.getName() == null) { ... }
    //创建团队
    teamMapper.addTeam(team);
}
```

- 方法上保留 Javadoc + `@Override`
- 关键步骤前加 `//` 行内注释说明意图

### Controller：Javadoc + 行内注释 + 类注释

```java
@Slf4j
// 团队相关接口
public class TeamController {

    /**
     * 创建团队
     * @param dto
     * @return
     */
    @PostMapping("/create")
    public Result<TeamVO> create(@RequestBody AddTeamDTO dto) {
        log.info("创建团队：{}", dto);
        //设置团队上下文，供@TeamAuth鉴权使用
        BaseContext.setCurrentTeamId(dto.getId());
        ...
    }
}
```

- 类上 `//` 一行中文说明
- 方法上 Javadoc（描述 + `@param` + `@return`）
- 关键操作前 `//` 行内注释

### Mapper 接口：Javadoc

每个方法必须有 Javadoc（`/** 描述 */` + `@param` + `@return`），无论 SQL 写在注解还是 XML 中。

### Mapper XML：不加注释

SQL 语句不加注释，保持简洁。

---

## 一、POJO 类规范

### Entity（实体类）

路径：`src/main/java/com/tex/texapi/pojo/entity/`

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Xxx {
    Long id;                          // 主键，Long 包装类型
    String name;
    String description;
    Long createUser;
    Long updateUser;
    LocalDateTime createTime;
    LocalDateTime updateTime;
    // ... 其他业务字段
}
```

规范：

- 四个 Lombok 注解：`@Data` `@NoArgsConstructor` `@AllArgsConstructor` `@Builder`
- 字段**不加 private**，默认包可见
- ID 用 `Long`（不用 `long`）
- 字段名 camelCase，由 MyBatis `map-underscore-to-camel-case: true` 自动映射数据库 snake_case
- 角色常量等放 Entity 里（如 `TeamMember.OWNER = 4`）

### DTO（数据传输对象，入参）

路径：`src/main/java/com/tex/texapi/pojo/dto/`

命名：`AddXxxDTO`（创建）、`UpdateXxxDTO`（更新）、`XxxQueryDTO`（查询条件）

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddXxxDTO {
    String name;          // 只放前端该传的字段
    String description;   // createUser/createTime 之类由后端自动填充，不要放
}
```

规范：

- 同一个四个注解
- **只放前端该传的字段**，createUser/createTime 等不要出现在 DTO 里
- 字段默认可见

### VO（视图对象，返参）

路径：`src/main/java/com/tex/texapi/pojo/vo/`

命名：`XxxVO`

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class XxxVO implements Serializable {
    Long id;
    String name;
    String description;
    LocalDateTime createTime;
}
```

规范：

- 四个注解 + `implements Serializable`
- 只放前端需要的字段，不一定要跟 Entity 一对一

---

## 二、Mapper 层

路径：`src/main/java/com/tex/texapi/server/mapper/`

### Mapper 接口

```java
@Mapper
public interface XxxMapper {

    // ========== 简单查询用注解 ==========

    @Select("select * from xxx where id = #{id}")
    Xxx getById(Long id);

    @Select("select * from xxx where xxx = #{param}")
    List<Xxx> getList(Long param);

    // ========== 简单删除用注解 ==========

    @Delete("delete from xxx where id = #{id}")
    void delete(Long id);

    // ========== 带自动填充的插入用 XML ==========

    @AutoFill(OperationType.INSERT)          // 触发 AOP 自动填 createTime/createUser
    void add(Xxx xxx);                       // SQL 在 XML 中

    // ========== 复杂/动态 SQL 用 XML ==========

    void update(Xxx xxx);                    // 动态 set，SQL 在 XML 中
}
```

规范：

- 接口加 `@Mapper`
- 简单 SQL（单行 select/delete）用注解：`@Select` `@Delete` `@Insert`
- INSERT 方法加 `@AutoFill(OperationType.INSERT)`，SQL 放 XML（因为需要 `useGeneratedKeys`）
- UPDATE 方法 SQL 放 XML（因为有 `<set>` 动态判断）
- 方法命名：`getById`、`getList`、`add`、`update`、`delete`
- 增删改返回 `void`，查返回 Entity 或 `List<Entity>`
- 方法只跟 Entity 打交道

### Mapper XML

路径：`src/main/resources/mapper/XxxMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
<mapper namespace="com.tex.texapi.server.mapper.XxxMapper">

    <insert id="add" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO xxx (name, description, create_user, create_time)
        VALUES (#{name}, #{description}, #{createUser}, #{createTime})
    </insert>

    <update id="update">
        UPDATE xxx
        <set>
            <if test="name != null and name != ''">name = #{name},</if>
            <if test="description != null">description = #{description},</if>
        </set>
        WHERE id = #{id}
    </update>

</mapper>
```

规范：

- **不用 `<resultMap>`**，项目全靠自动映射
- `namespace` 指向 Mapper 接口全限定名
- `<insert>` 加 `useGeneratedKeys="true" keyProperty="id"` 回填主键
- `<update>` 用 `<set>` + `<if test="...">` 实现动态更新
- SQL 列名 snake_case，`#{}` 占位符 camelCase
- 字符串判断：`test="name != null and name != ''"`
- 包装类型判断：`test="field != null"`

---

## 三、Service 层

### Service 接口

路径：`src/main/java/com/tex/texapi/server/service/`

```java
public interface XxxService {
    List<XxxVO> getList();                    // 查询 → 返参 VO
    XxxVO getById(Long id);                   // 单条 → 返参 VO
    void add(AddXxxDTO dto);                  // 创建 → 入参 DTO
    void update(UpdateXxxDTO dto);            // 更新 → 入参 DTO
    void delete(Long id);                     // 删除 → 入参基本类型
}
```

规范：

- 纯接口，无注解
- 入参用 DTO 或基本类型
- 返参用 VO 或 `void`
- **绝不出现 Entity**

### ServiceImpl

路径：`src/main/java/com/tex/texapi/server/service/impl/`

```java
@Service
public class XxxServiceImpl implements XxxService {

    @Autowired
    private XxxMapper xxxMapper;

    @Override
    public List<XxxVO> getList() {
        List<Xxx> list = xxxMapper.getList();
        return list.stream()
            .map(this::toVO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional                          // 只在写操作上加
    @TeamAuth(TeamMember.EDITOR)            // 需要鉴权的加
    public void add(AddXxxDTO dto) {
        Long userId = BaseContext.getCurrentId();
        Xxx entity = Xxx.builder()
            .name(dto.getName())
            .createUser(userId)
            .build();
        xxxMapper.add(entity);
    }

    @Override
    @TeamAuth(TeamMember.OWNER)
    public void delete(Long id) {
        xxxMapper.delete(id);
    }

    // ==== Entity → VO 转换（private）====

    private XxxVO toVO(Xxx entity) {
        return XxxVO.builder()
            .id(entity.getId())
            .name(entity.getName())
            .createTime(entity.getCreateTime())
            .build();
    }
}
```

规范：

- `@Service` 注解
- `@Autowired` 注入 Mapper（字段注入，不用构造器）
- 每个方法 `@Override`
- **只在创建方法上加 `@Transactional`**
- 鉴权用 `@TeamAuth(TeamMember.XXX)` 打在方法上
  - `VIEWER(1)` — 只读
  - `EDITOR(2)` — 编辑
  - `ADMIN(3)` — 管理成员
  - `OWNER(4)` — 删除团队
- `createUser` 从 `BaseContext.getCurrentId()` 取
- 异常直接抛，**不 try-catch**，由 `GlobalExceptionHandler` 统一处理
- 私有方法做 Entity → VO 转换

---

## 四、Controller 层

路径：`src/main/java/com/tex/texapi/server/controller/`

```java
@RestController
@RequestMapping("/tex/xxx")
@Slf4j
public class XxxController {

    @Autowired
    private XxxService xxxService;

    @GetMapping("/list")
    public Result<List<XxxVO>> list() {
        log.info("查询xxx列表");
        List<XxxVO> list = xxxService.getList();
        return Result.success(list);
    }

    @PostMapping("/create")
    public Result create(@RequestBody AddXxxDTO dto) {
        log.info("创建xxx：{}", dto);
        xxxService.add(dto);
        return Result.success();
    }

    @PutMapping("/update")
    public Result update(@RequestBody UpdateXxxDTO dto) {
        log.info("更新xxx：{}", dto);
        xxxService.update(dto);
        return Result.success();
    }

    @DeleteMapping("/delete/{id}")
    public Result delete(@PathVariable Long id) {
        log.info("删除xxx：{}", id);
        xxxService.delete(id);
        return Result.success();
    }
}
```

规范：

- `@RestController` + `@RequestMapping("/tex/{resource}")` + `@Slf4j`
- `@Autowired` 注入 Service
- 方法签名：
  - 查：`@GetMapping("/list")` 或 `@GetMapping("/{id}")`，返回 `Result<VO>` 或 `Result<List<VO>>`
  - 增：`@PostMapping("/create")`，入参 `@RequestBody XxxDTO`，返回 `Result`
  - 改：`@PutMapping("/update")`，入参 `@RequestBody XxxDTO`，返回 `Result`
  - 删：`@DeleteMapping("/delete/{id}")`，入参 `@PathVariable Long id`，返回 `Result`
- 入参只有 DTO 和基本类型，**绝不出现 Entity**
- 返回只有 VO 和基本类型，**绝不出现 Entity**
- `BaseContext.setCurrentTeamId(teamId)` 在需要团队上下文的方法里手动调用
- 日志：`log.info("中文描述：{}", data)`
- 返回格式：有数据 `Result.success(data)`，无数据 `Result.success()`

---

## 五、补充规范

### MessageConstant

路径：`src/main/java/com/tex/texapi/common/constant/`

```java
public class MessageConstant {
    public static final String NOT_TEAM_MEMBER = "非团队成员";
    public static final String PERMISSION_DENIED = "权限不足";
    // ...
}
```

使用：`throw new NoPermissionException(MessageConstant.NOT_TEAM_MEMBER)`

### 异常处理

- 自定义异常继承 `BaseException`
- 在 `GlobalExceptionHandler` 注册 `@ExceptionHandler`
- 业务代码不做 try-catch

### Result 格式

```java
Result<T> {
    code: Integer   // 1=成功, 0=失败
    msg:  String    // 错误信息（成功时为null）
    data: T         // 返回数据
}
```

- 成功有数据：`Result.success(data)`
- 成功无数据：`Result.success()`
- 失败：`Result.error("错误信息")`

### ThreadLocal 管理

- `BaseContext.setCurrentId(userId)` — JwtTokenInterceptor 自动设置
- `BaseContext.setCurrentTeamId(teamId)` — Controller 中手动设置（需要团队上下文的接口）
- 不清理 ThreadLocal（项目惯例，无 `afterCompletion`）

---

## 六、文件清单速查

新建完整 CRUD 模块的文件清单：

| #   | 文件          | 路径                                         |
| --- | ----------- | ------------------------------------------ |
| 1   | Entity      | `pojo/entity/Xxx.java`                     |
| 2   | Add DTO     | `pojo/dto/AddXxxDTO.java`                  |
| 3   | Update DTO  | `pojo/dto/UpdateXxxDTO.java`               |
| 4   | VO          | `pojo/vo/XxxVO.java`                       |
| 5   | Mapper 接口   | `server/mapper/XxxMapper.java`             |
| 6   | Mapper XML  | `resources/mapper/XxxMapper.xml`           |
| 7   | Service 接口  | `server/service/XxxService.java`           |
| 8   | ServiceImpl | `server/service/impl/XxxServiceImpl.java`  |
| 9   | Controller  | `server/controller/XxxController.java`     |
| 10  | 消息常量        | 追加到 `common/constant/MessageConstant.java` |

每个文件严格参照已有的 `Project` 模块风格编写。
