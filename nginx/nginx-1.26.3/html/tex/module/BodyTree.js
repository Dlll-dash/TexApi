import { typeList, typeExampleValue } from "../config/TypeConfig.js";
import { getRandomId } from "../utils/RandomUtil.js";
import { NodeMapManager } from "./NodeMapManager.js";

const nodeMap=NodeMapManager.getInstance();

// Body 树节点类
class TreeNode {
  constructor({ key, type, value, explanation }) {
    // 随机ID
    this.id = getRandomId();

    this.key = key;
    this.type = type;
    this.value = value;
    this.explanation = explanation;

    // 子节点列表
    this.children = [];

    //存入映射
    nodeMap.set(this.id,this);
  }

  // 添加子节点
  addChild(node) {
    this.children.push(node);
  }

  // 是否有子节点
  hasChild() {
    return this.children.length > 0;
  }

  //查询子节点索引
  findChild(id){
    const target=nodeMap.get(id);
    return this.children.indexOf(target);
  }

  //根据id删除子节点
  deleteChild(id){
    const idx=this.findChild(id);
    if(idx!==-1){
      //从Map中移除
      nodeMap.delete(this.children[idx].id);

      //从数组中删除
      this.children.splice(idx,1);
    }else{
      console.error("节点不存在,无法删除");
    }
  }

  // 递归删除所有子节点
  deleteAllChildren() {

    // 复制子节点列表，避免在遍历时修改原数组导致跳过元素
    [...this.children].forEach(child => {
      child.deleteAllChildren();
      this.deleteChild(child.id);
    });

  }

  //更新节点值
  set({key,type,value,explanation}){
    this.key=key;
    this.type=type;
    this.value=value;
    this.explanation=explanation;

    if(this.type!==typeList.object&&this.hasChild()){
      //如果非object就删除所有子节点。
      this.deleteAllChildren();
    }

  }

  // 提取当前节点属性
  toPlainObject() {
    return {
      id: this.id,
      key: this.key,
      type: this.type,
      value: this.value,
      explanation: this.explanation
    };
  }

  // 转为 只包含 key:value 的 JSON 对象（修复递归逻辑）
  /*

    {
        key:value,
        key:{
            key:value,
            ...
        }
    }

  */
  static toKeyValueJson(root) {
    if (!root) return {};

    const obj = {};
    root.children.forEach(child => {
      if (child.type !== typeList.object) {
        // 普通类型直接取值
        obj[child.key] = child.value ?? typeExampleValue[child.type];
      } else {
        // 对象类型递归构建
        obj[child.key] = this.toKeyValueJson(child);
      }
    });

    return obj;
  }

  // 转为 包含全部4个属性的 JSON 对象
  /*

    {
        key:{
            type: ,
            value: ,
            explanation:
        },  
        key:{
            type: Object,
            value:{
                key:{
                    ...
                }
            },
            explanation:
        }
    }

  */
  static toFullAttrJson(root) {
    if (!root) return {};

    const obj = {};
    root.children.forEach(child => {
      const baseAttr = {
        type: child.type,
        explanation: child.explanation
      };

      if (child.type !== typeList.object) {
        obj[child.key] = {
          ...baseAttr,
          value: child.value ?? typeExampleValue[child.type]
        };
      } else {
        obj[child.key] = {
          ...baseAttr,
          value: this.toFullAttrJson(child)
        };
      }
    });

    return obj;
  }



  //将JSON对象转为树(id : node的映射表)
  static convertFromJson(json){
    
    // if (!json) return null;
    // // 允许传入字符串或对象
    // const data = typeof json === "string" ? JSON.parse(json) : json;
    // if (!data || typeof data !== "object") return null;

    const root = new TreeNode({
      key: "根节点",
      type: typeList.object,
      value: null,
      explanation: "",
    });

    const buildTree = (parent, data) => {
      if (!data || typeof data !== "object") return;

      Object.entries(data).forEach(([key, item]) => {
        if (!item) return;

        const node = new TreeNode({
          key: key,
          type: item.type || typeList.string,
          value: item.type === typeList.object ? null : item.value,
          explanation: item.explanation || "",
        });

        parent.addChild(node);

        // 递归构建子对象
        if (node.type === typeList.object && item.value) {
          buildTree(node, item.value);
        }
      });
    };

    buildTree(root, json);
    return root;
  }


}


export { TreeNode };