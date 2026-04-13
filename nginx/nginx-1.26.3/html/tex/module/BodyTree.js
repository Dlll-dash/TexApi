import { typeList, typeExampleValue } from "../config/TypeConfig";
import { getRandomId } from "../utils/RandomUtil";
import { NodeMapManager } from "./NodeMapManager";

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

    // 递归删除子节点的子节点
    this.children.forEach(child => {
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
        obj[child.key] = TreeNode.toKeyValueJson(child);
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
          value: TreeNode.toFullAttrJson(child)
        };
      }
    });

    return obj;
  }



  //将JSON对象转为树(id : node的映射表)
  static convertFromJson(json){
    


    function buildTree(data){
        if(!data||typeof data !== 'object')return;

        for(const [key,item] of Object.entries(data)){
            const { type,value,explanation } = item;

            const node=new TreeNode({
                key : key,
                type : type,
                value : type == typeList.object ? null : value,
                explanation : explanation
            })


            if(type == typeList.object){
                //继续构建
                node.addChild(buildTree(node,value));
            }

            return node;
        }

    }
    
    return buildTree(json);
  }


}


export { TreeNode };