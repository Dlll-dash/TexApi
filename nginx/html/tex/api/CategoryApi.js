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
    },
    //根据分类id获取接口列表
    getApisByCategoryId(categoryId){
        return request.get(`${baseUrl}/${categoryId}/apis`)
    },
    //获取草稿+主表合并分类树（编辑页面使用）
    getDraftCategories(projectId){
        return request.get(`${baseUrl}/drafts/${projectId}`)
    },
    //发布草稿分类到主表
    publishCategories(projectId){
        return request.post(`${baseUrl}/publish/${projectId}`)
    },
    //发布单个分类及其子孙
    publishCategory(categoryId){
        return request.post(`${baseUrl}/${categoryId}/publish`)
    },
    //丢弃草稿分类
    discardCategories(projectId){
        return request.delete(`${baseUrl}/drafts/${projectId}`)
    }
}

export {CategoryApi}