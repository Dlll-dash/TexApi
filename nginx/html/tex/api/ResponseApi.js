import { request } from "../config/AxiosConfig/AxiosConfig.js";
function createResponseApi(apiId) {
  return {
    async add(data) {
      return request.post('/response/add', data);
    },
    async list() {
      return request.get(`/response/list/${apiId}`);
    },
    async getResponse(responseId) {
      return request.get(`/response/getResponse/${responseId}`);
    },
    async updateInfo(data) {
      return request.put('/response/updateInfo', data);
    },
    async updateBody(data) {
      return request.put('/response/updateBody', data);
    }
  };
}

export { createResponseApi };