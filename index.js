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
            <button onclick={() => {
                this.setState({
                    a: this.state.a + 1
                })
            }}>add</button>
            <div>a : {this.state.a.toString()}</div>
            <div>b : {this.state.b.toString()}</div>
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