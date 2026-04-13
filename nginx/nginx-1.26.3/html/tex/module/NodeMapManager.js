

// id-TreeNode映射（单例模式）

class NodeMapManager {

    // 内部唯一的 Map
    static #instance = null;
    #map = new Map();

    // 只能通过静态方法获取单例，而不能使用new
    static getInstance() {
        if (!this.#instance) {
            this.#instance = new NodeMapManager();
        }
        return this.#instance;
    }

    // 存节点
    set(id, node) {
        this.#map.set(id, node);
    }

    // 取节点
    get(id) {
        return this.#map.get(id);
    }

    // 删除节点
    delete(id) {
        this.#map.delete(id);
    }

    // 清空
    clear() {
        this.#map.clear();
    }
}

export {NodeMapManager};