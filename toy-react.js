const RENDER_TO_DOM = Symbol('render to dom'); // 实现私有方法名

export class Component {
    constructor() {
        this.props = Object.create(null); // 空对象
        this.children = [];
    }
    setAttribute(name, value) {
        this.props[name] = value;
    }
    appendChild(component) {
        this.children.push(component);
    }
    get vdom() {
        return this.render().vdom; // 每个 vdom 就是 class 的 this
    }
    [RENDER_TO_DOM](range) { // 位置相关
        this._range = range;
        this._vdom = this.vdom;
        this._vdom[RENDER_TO_DOM](range);
    }
    update() { // vdom 对比算法
        const isSameNode = (oldNode, newNode) => {
            if (oldNode.type !== newNode.type)
                return false;

            for (const name in newNode.props) {
                if (oldNode.props[name] !== newNode.props[name])
                    return false;
            }

            if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length)
                return false

            if (newNode.type === '#text') {
                if (newNode.content !== oldNode.content)
                    return false;
            }

            return true;
        }

        const update = (oldNode, newNode) => { // 对比
            // 对比 root type / props ，完全一致才不更新；对比 children
            // #text 还要对比 content

            if (!isSameNode(oldNode, newNode)) { // 从根节点就不一样
                newNode[RENDER_TO_DOM](oldNode._range); // 新节点替换旧节点
                return;
            }

            // 根节点比对一致 将 newNode 的 range 设置为 oldNode 的 range
            newNode._range = oldNode._range;

            const newChildren = newNode.vchildren;
            const oldChildren = oldNode.vchildren;

            if (!(newChildren && newChildren.length)) {
                return;
            }

            for (let index = 0; index < newChildren.length; index++) {
                const newChild = newChildren[index];
                const oldChild = oldChildren[index];
                let tailRange = oldChildren[oldChildren.length - 1]._range;
                if (index < oldChildren.length) {
                    update(oldChild, newChild);
                } else {
                    // 把 range 设置到 oldChildren 的末尾
                    const range = document.createRange();
                    range.setStart(tailRange.endContainer, tailRange.endOffset);
                    range.setEnd(tailRange.endContainer, tailRange.endOffset);

                    newChild[RENDER_TO_DOM](range);
                    tailRange = range;
                }
            }
        }
        const vdom = this.vdom;
        update(this._vdom, vdom);
        this._vdom = vdom;
    }
    // rerender() {
    //     // range bug
    //     // range 被清空时，如果有相邻的range会被吞进相邻的range里
    //     // 此时需要保证 range 不空
    //     // 先插入 再删除

    //     // 保存老的range
    //     const oldRange = this._range;

    //     // 创建一个新的range 放在 oldRange 起始的范围 完成插入
    //     const insertRange = document.createRange();
    //     insertRange.setStart(oldRange.startContainer, oldRange.startOffset);
    //     insertRange.setEnd(oldRange.startContainer, oldRange.startOffset);
    //     this[RENDER_TO_DOM](insertRange);

    //     // 重设oldRange起始范围 设置为插入的内容之后 清空 oldRange
    //     oldRange.setStart(insertRange.endContainer, insertRange.endOffset);
    //     oldRange.deleteContents();
    // }
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
        // this.rerender();
        this.update();
    }
}

function replaceContent(range, node) {
    range.insertNode(node);
    range.setStartAfter(node);
    range.deleteContents();

    range.setStartBefore(node);
    range.setEndAfter(node);
}

class ElementWrapper extends Component {
    constructor(type) {
        super(type);
        this.type = type;
    }

    // setAttribute(name, value) {
    //     if (name.match(/^on([\s\S]+)$/)) { // 小技巧 [\s\S] 表示所有字符
    //         this.root.addEventListener(RegExp.$1.toLowerCase(), value) // 事件绑定
    //     } else {
    //         if (name === 'className') {
    //             this.root.setAttribute('class', value)
    //         } else {
    //             this.root.setAttribute(name, value);
    //         }
    //     }
    // }

    // appendChild(component) {
    //     const range = document.createRange();
    //     range.setStart(this.root, this.root.childNodes.length); // 在this.root末尾追加
    //     range.setEnd(this.root, this.root.childNodes.length);
    //     component[RENDER_TO_DOM](range);
    // }

    get vdom() {
        this.vchildren = this.children.map(child => child.vdom);
        return this;
    }

    [RENDER_TO_DOM](range) { // 位置相关
        this._range = range; // 每次 render 时保存当前 range

        const root = document.createElement(this.type);

        for (const name in this.props) {
            const value = this.props[name];
            if (name.match(/^on([\s\S]+)$/)) { // 小技巧 [\s\S] 表示所有字符
                root.addEventListener(RegExp.$1.toLowerCase(), value) // 事件绑定
            } else {
                if (name === 'className') {
                    root.setAttribute('class', value)
                } else {
                    root.setAttribute(name, value);
                }
            }
        }

        if (!this.vchildren)
            this.vchildren = this.children.map(child => child.vdom);

        for (const child of this.vchildren) {
            const childRange = document.createRange();
            childRange.setStart(root, root.childNodes.length); // 在this.root末尾追加
            childRange.setEnd(root, root.childNodes.length);
            child[RENDER_TO_DOM](childRange);
        }

        replaceContent(range, root)
    }
}

class TextWrapper extends Component {
    constructor(content) {
        super(content);
        this.type = '#text';
        this.content = content;
    }

    get vdom() {
        return this;
    }

    [RENDER_TO_DOM](range) { // 位置相关
        this._range = range;
        const root = document.createTextNode(this.content);
        replaceContent(range, root)
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