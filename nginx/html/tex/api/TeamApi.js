import { request } from '../config/AxiosConfig/AxiosConfig.js'

const baseUrl = '/team'
const TeamApi = {
    //获取当前用户的团队列表
    list() {
        return request.get(`${baseUrl}/list`)
    },
    //创建团队
    create(data) {
        return request.post(`${baseUrl}/create`, data)
    },
    //更新团队信息
    update(data) {
        return request.put(`${baseUrl}/update`, data)
    },
    //删除团队
    delete(teamId) {
        return request.delete(`${baseUrl}/delete/${teamId}`)
    },
    //邀请成员
    invite(teamId, data) {
        return request.post(`${baseUrl}/${teamId}/invite`, data)
    },
    //移除成员
    removeMember(teamId, userUuid) {
        return request.delete(`${baseUrl}/${teamId}/member/${userUuid}`)
    },
    //修改成员角色
    updateMemberRole(teamId, userUuid, data) {
        return request.put(`${baseUrl}/${teamId}/member/${userUuid}`, data)
    },
    //获取团队成员列表
    listMembers(teamId) {
        return request.get(`${baseUrl}/${teamId}/members`)
    }
}

export { TeamApi }
