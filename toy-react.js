const RENDER_TO_DOM = Symbol('render to dom'); // 实现私有方法名

class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type);
    }

    setAttribute(name, value) {
        if (name.match(/^on([\s\S]+)$/)) { // 小技巧 [\s\S] 表示所有字符
            this.root.addEventListener(RegExp.$1.toLowerCase(), value) // 事件绑定
        } else {
            if (name === 'className') {
                this.root.setAttribute('class', value)
            } else {
                this.root.setAttribute(name, value);
            }
        }
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
        this._range = null;
    }
    setAttribute(name, value) {
        this.props[name] = value;
    }
    appendChild(component) {
        this.children.push(component);
    }
    [RENDER_TO_DOM](range) { // 位置相关
        this._range = range;
        this.render()[RENDER_TO_DOM](range);
    }
    rerender() {
        // range bug
        // range 被清空时，如果有相邻的range会被吞进相邻的range里
        // 此时需要保证 range 不空
        // 先插入 再删除

        // 保存老的range
        const oldRange = this._range;

        // 创建一个新的range 放在 oldRange 起始的范围 完成插入
        const insertRange = document.createRange();
        insertRange.setStart(oldRange.startContainer, oldRange.startOffset);
        insertRange.setEnd(oldRange.startContainer, oldRange.startOffset);
        this[RENDER_TO_DOM](insertRange);

        // 重设oldRange起始范围 设置为插入的内容之后 清空 oldRange
        oldRange.setStart(insertRange.endContainer, insertRange.endOffset);
        oldRange.deleteContents();
    }
    setState(newState) {

        if (this.state === null || typeof this.state !== 'object') { // 无原始state
            this.state = newState;
            this.rerender();
            return;
        }

        const merge = (oldState, newState) => { // 深拷贝merge
            for (const key in newState) {
                if (oldState[key] === null || typeof oldState[key] !== 'object') {
                    oldState[key] = newState[key];
                } else {
                    merge(oldState[key], newState[key])
                }
            }
        }

        merge(this.state, newState);
        this.rerender();
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

            if (child === null) {
                continue;
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