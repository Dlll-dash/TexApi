import { request } from '../config/AxiosConfig/AxiosConfig.js'

const UserApi = {
    //获取当前用户信息
    getProfile() {
        return request.get('/user/profile')
    }
}

export { UserApi }
