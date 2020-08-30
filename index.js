import { createElement, render, Component } from './toy-react';

class MyComponent extends Component {
    constructor() {
        super();
        this.state = {
            a: 1,
            b: 2
        }
    }
    render() {
        return <div>
            <h1>MyComponent</h1>
            <span>{this.state.a.toString()}</span>
            {this.children}
        </div>
    }
}

const html = <MyComponent id="first" class="first">
    <div id="second" class="second">
        <div id="third" class="third"></div>
    </div>
    <div id="second-2" class="second-2">abc</div>
</MyComponent>


render(html, document.body);
window.html = html;