const RENDER_TO_DOM = Symbol('render to dom'); // 实现私有方法名

class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type);
    }

    setAttribute(name, value) {
        this.root.setAttribute(name, value);
    }

    appendChild(component) {
        const range = document.createRange();
        range.setStart(this.root, this.root.childNodes.length); // 在this.root末尾追加
        range.setEnd(this.root, this.root.childNodes.length);
        component[RENDER_TO_DOM](range);
    }

    [RENDER_TO_DOM](range) { // 位置相关
        range.deleteContents();
        range.insertNode(this.root);
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
    }

    [RENDER_TO_DOM](range) { // 位置相关
        range.deleteContents();
        range.insertNode(this.root);
    }
}

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
    [RENDER_TO_DOM](range) { // 位置相关
        this.render()[RENDER_TO_DOM](range);
    }
}

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
            e.setAttribute(attr, attribute[attr])
        }
    }

    // children 是数组
    const insertChildren = (children) => {
        for (let child of children) {
            if (typeof child === 'string') {
                child = new TextWrapper(child)
            }

            if (typeof child === 'object' && child instanceof Array) {
                insertChildren(child);
            } else {
                e.appendChild(child);
            }
        }
    }

    insertChildren(children);

    return e;
}

export function render(component, container) {
    const range = document.createRange(); // 创建range
    range.setStart(container, 0); // range 开头
    range.setEnd(container, container.childNodes.length); // range 结尾
    range.deleteContents(); // 清空当前range
    component[RENDER_TO_DOM](range); // 渲染
    // 此时render方法的语义是将container节点清空进行渲染
}