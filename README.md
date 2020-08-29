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