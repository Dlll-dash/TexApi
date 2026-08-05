import { request } from "../config/AxiosConfig/AxiosConfig.js";

export const ApiApi = {
    /**
     * 创建API
     * @param {Object} data - { apiName, requestMethod, requestUrl, status, ... }
     */
    async add(data) {
        return request.post('/api/add', data);
    },

    /**
     * 更新API
     * @param {Object} data - { id, apiName, requestMethod, requestUrl, status, ... }
     */
    async update(data) {
        return request.put('/api/update', data);
    },

    /**
     * 删除API
     * @param {number} id
     */
    async delete(id) {
        return request.delete(`/api/delete/${id}`);
    },

    /**
     * 获取API列表（草稿）
     * @param {number} projectId
     */
    async list(projectId) {
        return request.get(`/api/list/${projectId}`);
    },

    /**
     * 获取主表API列表（已发布，所有成员）
     * @param {number} projectId
     */
    async listMasters(projectId) {
        return request.get(`/api/master/list/${projectId}`);
    },

    /**
     * 发送调试请求
     * @param {Object} data - { apiId, contentType }
     */
    async send(data) {
        return request.post('/api/send', data);
    },

    /**
     * 更新API基本信息
     * @param {Object} data - { id, apiName, status, explanation, inChargeUser }
     */
    async updateInfo(data) {
        return request.put('/api/updateInfo', data);
    },

    /**
     * 查看主表API（只读）
     * @param {number} id
     */
    async getMaster(id) {
        return request.get(`/api/master/${id}`);
    },

    /**
     * 发布草稿
     * @param {number} draftId
     * @param {string} expectedMasterUpdateTime
     */
    async publish(draftId, expectedMasterUpdateTime) {
        return request.post(`/api/${draftId}/publish`, null, {
            params: { expectedMasterUpdateTime }
        });
    },

    /**
     * 放弃草稿
     * @param {number} draftId
     */
    async discardDraft(draftId) {
        return request.delete(`/api/${draftId}/draft`);
    },

    /**
     * 批量导出
     * @param {Array} list
     */
    async exportBatch(list) {
        return request.post('/api/export', list);
    }
};
