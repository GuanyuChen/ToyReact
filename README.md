# ToyReact

## createElement 函数细节

转换前
```
const html = <div id="first" class="first">
    <div id="second" class="second">
        <div id="third" class="third"></div>
    </div>
    <div id="second-2" class="second-2">abc</div>
</div>
```

转换后
```
var html = createElement("div", {
  id: "first",
  "class": "first"
}, createElement("div", {
  id: "second",
  "class": "second"
}, createElement("div", {
  id: "third",
  "class": "third"
})), createElement("div", {
  id: "second-2",
  "class": "second-2"
}, "abc"));
```

基于真实`DOM`的`createElement`(简单版)
```
function createElement(tagName, attribute, ...children) {
    const e = document.createElement(tagName);

    // attribute 是对象
    for (const attr in attribute) {
        if (attribute.hasOwnProperty(attr)) {
            e.setAttribute(attr, attribute[attr])
        }
    }

    // children 是数组
    for (const child of children) {
        if (typeof child === 'string') {
            e.appendChild(document.createTextNode(child))
        } else {
            e.appendChild(child);
        }
    }

    return e;
}
```

## 自定义组件机制

> React约定 大写字母开头为自定义组件

## toy-react 内部实现

### Component 类

自定义 Component 基类

```
export class Component {
    constructor() {
        this.props = Object.create(null); // 空对象
        this.children = [];
        this._root = null;
    }
    setAttribute(name, value) {
        this.props[name] = value;
    }
    appendChild(component) {
        this.children.push(component);
    }
    get root() {
        if (!this._root) {
            this._root = this.render().root;
        }
        return this._root;
    }
}
```

* `constructor` ：初始化相关变量
* `setAttribute` ：将属性放到`props`数组中 （暂未详细实现）
* `appendChild` ：将传入的`component`放入`children`数组中
* `get root` ：返回`Component`的子类中定义的`render`方法的返回值

### ElementWrapper

HTML标签的包装对象

```
class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type);
    }

    setAttribute(name, value) {
        this.root.setAttribute(name, value);
    }

    appendChild(component) {
        this.root.appendChild(component.root)
    }
}
```

* `constructor` ：`this.root`返回真实DOM节点
* `setAttribute` ：代理到`this.root`真实DOM节点的`setAttribute`
* `appendChild` ：代理到`this.root`真实DOM节点的`appendChild`

### TextWrapper

文本节点的包装对象

```
class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
    }
}
```

### createElement **重要**

自定义`component`创建，暴露给外部

```
export function createElement(type, attribute, ...children) {
    let e;

    if (typeof type === 'string') {
        e = new ElementWrapper(type); // HTML 实体
    } else {
        e = new type; // 自定义component
    }

    // attribute 是对象
    for (const attr in attribute) {
        if (attribute.hasOwnProperty(attr)) {
            e.setAttribute(attr, attribute[attr]) // 无论是自定义component还是ElementWrapper都实现了setAttribute方法
        }
    }

    // children 是数组
    const insertChildren = (children) => {
        for (let child of children) {
            if (typeof child === 'string') {
                child = new TextWrapper(child)
            }

            if (typeof child === 'object' && child instanceof Array) { // child是一个数组时，递归调用
                insertChildren(child);
            } else {
                e.appendChild(child); // 无论是自定义component还是ElementWrapper都实现了appendChild方法
            }
        }
    }

    insertChildren(children);

    return e;
}
```

### render 方法

将自定义`component`实体DOM节点挂载到DOM树上，暴露给外部
```
export function render(component, container) {
    container.appendChild(component.root);
}
```

## 基于 range 的 DOM 渲染

## vdom

* 将`document.createElement`、`document.createText`调用挪到`[RENDER_TO_DOM]`方法里
* `attribute`的赋值也在`[RENDER_TO_DOM]`方法中
* `ElementWrapper`、`TextWrapper`都是`Component`的子类