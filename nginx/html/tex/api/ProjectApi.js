import { request } from '../config/AxiosConfig/AxiosConfig.js'

const baseUrl = '/project'
const ProjectApi = {
    //根据团队ID获取项目列表
    listByTeam(teamId) {
        return request.get(`${baseUrl}/list/${teamId}`)
    },
    //创建项目
    create(data) {
        return request.post(`${baseUrl}/create`, data)
    },
    //更新项目
    update(data) {
        return request.put(`${baseUrl}/update`, data)
    },
    //删除项目
    delete(projectId, teamId) {
        return request.delete(`${baseUrl}/delete/${projectId}?teamId=${teamId}`)
    }
}

export { ProjectApi }
