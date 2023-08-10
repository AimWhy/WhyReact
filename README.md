## 初衷

23年3月底离职了，本想回到老家找一份远程工作的机会、事与愿违

# 只有函数组件奥、 内置dom元素（svg 家族暂未处理）

组件就是一个函数， 包含固定参数
`
function App(props, oldProps, { instance, useEffect, useState, useSyncExternalStore}) {

let [state, setState] = useState('');
if(你的逻辑) {
return <div>布拉布拉</div>
}

    return <ABC />

}
`

## 已实现的功能

- Fragment
- 子元素数组
- useState
- useEffect
- useSyncExternalStore
- 批处理更新
- 元素事件回调 （Once|Passive|Capture） 例： onClickOnce={}
- onInput 中文输入合成判断
- KeepAlive (任何组件，)
- Portal (Fragment 带 target 属性) 没必要多引入一个组件

## 特点

源码特别少， 700 多行吧， 常规功能基本满足

状态保留使用 generator（天然支持状态保留）
