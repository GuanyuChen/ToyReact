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

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
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
    get root() {
        if (!this._root) {
            this._root = this.render().root;
        }
        return this._root;
    }
}

export function createElement(type, attribute, ...children) {
    let e;

    if (typeof type === 'string') {
        e = new ElementWrapper(type);
    } else {
        e = new type;
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
    container.appendChild(component.root);
}