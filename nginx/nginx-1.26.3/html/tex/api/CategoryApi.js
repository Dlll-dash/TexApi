import {request} from '../config/AxiosConfig/AxiosConfig.js'

const baseUrl = '/categories'
const CategoryApi={
    //获取分类列表根节点
    getCategories(projectId){
        return request.get(`${baseUrl}/${projectId}`)
    },
    //新增分类节点
    add(data){
        return request.post(`${baseUrl}`,data)
    },
    //更新分类节点
    update(id,data){
        return request.put(`${baseUrl}/${id}`,data)
    },
    //删除分类节点及其子节点和其下的接口
    delete(categoryId){
        return request.delete(`${baseUrl}/${categoryId}`)
    }
}

export {CategoryApi}