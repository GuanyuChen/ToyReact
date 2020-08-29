module.exports = {
    entry: { // 入口
        main: './index.js'
    },
    mode: 'development', // dev模式
    optimization: {
        minimize: false // 不压缩
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],  // preset里包含多个plugin
                        // 把jsx语法翻译成createElement函数
                        plugins: [['@babel/plugin-transform-react-jsx', { pragma: "createElement" }]] // 第二个参数传入配置 
                        // plugins: ['@babel/plugin-transform-react-jsx']
                    }
                }
            }
        ]
    }
}