import { request } from "../config/AxiosConfig/AxiosConfig.js";

export const RequestParamsApi = {
    /**
     * 获取参数列表
     * @param {number} apiId
     * @param {string} formatType - query/formData/urlencoded/json/header
     */
    async list(apiId, formatType) {
        return request.get('/request/param/list/' + apiId, {
            params: { formatType }
        });
    },

    /**
     * 新增参数
     * @param {Object} data - { name, value, type, explanation, apiId, formatType, isNecessary, isChecked }
     */
    async add(data) {
        return request.post('/request/param', data);
    },

    /**
     * 更新参数
     * @param {number} id
     * @param {Object} data
     */
    async update(id, data) {
        return request.put('/request/param/' + id, data);
    },

    /**
     * 删除参数
     * @param {number} id
     */
    async delete(id) {
        return request.delete('/request/param/delete/' + id);
    },

    /**
     * 获取主表参数列表（只读）
     * @param {number} masterApiId
     * @param {string} formatType
     */
    async masterList(masterApiId, formatType) {
        return request.get('/request/param/master/list/' + masterApiId, {
            params: { formatType }
        });
    }
};
