export const jsx = (type, props = {}, key = null) => ({
	key,
	type,
	props
});

export const NoFlags = 0b0000000;
export const Placement = 0b0000001;
export const Update = 0b0000010;
export const ChildDeletion = 0b0000100;
export const MarkReusableFiber = 0b001000;

export const checkTrue = () => true;

export const Fragment = (props = {}) => props.children;

const makeMap = (list) => {
	const memo = new Set(list);
	return (val) => memo.has(val);
};

export const objectEqual = (object1, object2, isDeep) => {
	if (object1 === object2) {
		return true;
	}

	if (
		typeof object1 !== 'object' ||
		typeof object2 !== 'object' ||
		object1 === null ||
		object2 === null
	) {
		return false;
	}

	const keys1 = Object.keys(object1);
	const keys2 = Object.keys(object2);

	if (keys1.length !== keys2.length) {
		return false;
	}

	for (const key of keys1) {
		const o1 = object1[key];
		const o2 = object2[key];

		if (isDeep) {
			if (!objectEqual(o1, o2, true)) {
				return false;
			}
		} else {
			if (o1 !== o2) {
				return false;
			}
		}
	}

	return true;
};

export const isSpecialBooleanAttr = makeMap([
	'itemscope',
	'allowfullscreen',
	'formnovalidate',
	'ismap',
	'nomodule',
	'novalidate',
	'readonly'
]);
export const includeBooleanAttr = (value) => !!value || value === '';

const HTML_TAGS =
	'html,body,base,head,link,meta,style,title,address,article,aside,footer,header,hgroup,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot'.split(
		','
	);

const isHTMLTag = makeMap(HTML_TAGS);

export const genCursorFix = () => {
	const focusedElement = document.activeElement;
	const start = focusedElement.selectionStart;
	const end = focusedElement.selectionEnd;

	// 重新定位焦点, 恢复选择位置
	return () => {
		focusedElement.focus();
		focusedElement.selectionStart = start;
		focusedElement.selectionEnd = end;
	};
};

const uniqueSet = new Set();
export const queueMicrotaskOnce = (func) => {
	if (!uniqueSet.has(func)) {
		uniqueSet.add(func);
		queueMicrotask(() => {
			func();
			uniqueSet.delete(func);
		});
	}
};

let isMessageLoopRunning = false;
const scheduledCallbackQueue = [];
const frameYieldMs = 8;
const channel = new MessageChannel();

channel.port1.onmessage = function performWork() {
	const startTime = performance.now();
	console.count('queueMacrotask');

	if (scheduledCallbackQueue.length) {
		try {
			let timeElapsed = 0;
			while (timeElapsed < frameYieldMs && scheduledCallbackQueue.length) {
				const work = scheduledCallbackQueue.shift();
				work();
				timeElapsed = performance.now() - startTime;
			}
		} finally {
			if (scheduledCallbackQueue.length) {
				schedulePerform();
			} else {
				isMessageLoopRunning = false;
			}
		}
	} else {
		isMessageLoopRunning = false;
	}
};

const schedulePerform = () => channel.port2.postMessage(null);

export const queueMacrotask = (callback) => {
	scheduledCallbackQueue.push(callback);
	if (!isMessageLoopRunning) {
		isMessageLoopRunning = true;
		schedulePerform();
	}
};

const onCompositionStart = (e) => {
	e.target.composing = true;
};
const onCompositionEnd = (e) => {
	const target = e.target;
	if (target.composing) {
		target.composing = false;
		target.dispatchEvent(new Event('input'));
	}
};

const onInputFixed = (e) => {
	if (!e.target.composing) {
		e.target[elementPropsKey]['onInput'](e);
	}
};

const eventCallback = (e) => {
	const pKey = `on${e.type[0].toUpperCase()}${e.type.slice(1)}`;
	if (e.target[elementPropsKey][pKey]) {
		e.target[elementPropsKey][pKey](e);
	}
};

const optionsModifierRE = /(?:Once|Passive|Capture)$/;
export const parseEventName = (name) => {
	let options = void 0;
	if (optionsModifierRE.test(name)) {
		options = {};
		let m;
		while ((m = name.match(optionsModifierRE))) {
			name = name.slice(0, name.length - m[0].length);
			options[m[0].toLowerCase()] = true;
		}
	}
	const event = name.slice(2).toLowerCase();
	return [event, options];
};

const unBubbleEventSet = new Set(['blur']);

export function fixUnBubbleEvent(dom, pKey) {
	const [eventName, options] = parseEventName(pKey);
	if (eventName === 'input') {
		dom.addEventListener('compositionstart', onCompositionStart);
		dom.addEventListener('compositionend', onCompositionEnd);
		dom.addEventListener('change', onCompositionEnd);
		dom.addEventListener('input', onInputFixed);
	}

	if (unBubbleEventSet.has(eventName)) {
		dom.addEventListener(eventName, eventCallback, options);
	}
}

let workInProgress = null;

const ComponentGenMemo = new WeakMap();
const genComponentInnerElement = (fiber) => {
	if (
		!fiber.isSelfStateChange &&
		ComponentGenMemo.has(fiber) &&
		objectEqual(fiber.memoizedProps, fiber.pendingProps)
	) {
		return ComponentGenMemo.get(fiber);
	}

	let result = null;
	const preFiber = workInProgress;
	try {
		fiber.StateIndex = 0;
		workInProgress = fiber;
		result = fiber.type(fiber.pendingProps, { useState });
	} finally {
		workInProgress = preFiber;
	}

	// console.log('Retain Component', fiber);
	ComponentGenMemo.set(fiber, result);
	return result;
};

export const useState = (initialState) => {
	const fiber = workInProgress;
	const innerIndex = fiber.StateIndex++;
	const { hookQueue, forceRender } = fiber;

	if (hookQueue.length <= innerIndex) {
		if (typeof initialState === 'function') {
			initialState = initialState();
		}
		hookQueue[innerIndex] = initialState;
	}

	return [
		hookQueue[innerIndex],
		(newState) => {
			if (typeof newState === 'function') {
				const oldState = hookQueue[innerIndex];
				newState = newState(oldState);
			}
			hookQueue[innerIndex] = newState;
			forceRender();
		}
	];
};

export class Fiber {
	key = null;
	pKeys = [];
	type = null;
	pendingProps = {};
	memoizedProps = {};
	memoizedState = null;

	_index = 0;
	oldIndex = -1;
	stateNode = null;

	child = null;
	return = null;
	sibling = null;
	deletions = [];

	flags = NoFlags;

	StateIndex = 0;
	hookQueue = [];

	lifecycle = {
		onMounted: [],
		onUpdated: [],
		onUnmounted: [],
		onBeforeMount: [],
		onBeforeUpdate: [],
		onBeforeUnmount: [],
		onActivated: [],
		onDeactivated: []
	};

	forceRender = () => {
		pushRenderFiber(this);
	};

	get index() {
		return this._index;
	}
	set index(value) {
		this.oldIndex = this.oldIndex === -1 ? value : this._index;
		this._index = value;
	}

	get normalChildren() {
		let children = [];
		if (this.type === 'text') {
			return children;
		}

		if (isHTMLTag(this.type)) {
			if (this.pendingProps.children !== void 0) {
				children = [].concat(this.pendingProps.children);
			}
		} else {
			const innerRootElement = genComponentInnerElement(this);

			if (innerRootElement !== void 0) {
				children = [].concat(innerRootElement);
			}
		}

		children = children.map((item) => {
			if (typeof item === 'string' || typeof item === 'number') {
				return jsx('text', { content: item });
			} else if (Array.isArray(item)) {
				return jsx(Fragment, { children: item });
			} else if (!item || !item.type) {
				return jsx('text', { content: '' });
			} else {
				return item;
			}
		});

		return children;
	}

	get isSelfStateChange() {
		return (this.flags & Update) !== NoFlags;
	}

	get inStateChangeScope() {
		if (this.isSelfStateChange) {
			return true;
		} else if (!this.return) {
			return false;
		} else {
			return this.return.inStateChangeScope;
		}
	}

	constructor(element, key, pKeys) {
		this.key = key;
		this.pKeys = pKeys;
		this.nodeKey = Fiber.genNodeKey(key, pKeys);
		this.type = element.type;
		this.pendingProps = element.props;
		this.flags = Placement;

		if (element.props.__target) {
			this.stateNode = element.props.__target;
		} else if (element.type === 'text') {
			this.stateNode = document.createTextNode(element.props.content);
		} else if (typeof element.type === 'string') {
			this.stateNode = document.createElement(element.type);
		}

		if (this.stateNode) {
			this.stateNode.__fiber = this;
		}

		// Object.keys(this.lifecycle).forEach((hookName) => {
		// 	this[hookName] = (callback) => {
		// 		this.lifecycle[hookName].push(callback);
		// 	};
		// });
	}

	isDescendantOf(returnFiber) {
		return this.nodeKey.startsWith(
			[...returnFiber.pKeys, returnFiber.key].join(':')
		);
	}

	flushEffects() {}
}
Fiber.ExistPool = new Map();
Fiber.genNodeKey = (key, pKeys = []) => `${pKeys.join(':')}-${key}`;
Fiber.isHostFiber = (fiber) => fiber && typeof fiber.type === 'string';

function* walkChildFiber(returnFiber) {
	let fiber = returnFiber.child;
	while (fiber) {
		yield fiber;
		fiber = fiber.sibling;
	}
}

export function* walkFiberTree(returnFiber) {
	let fiber = returnFiber.child;
	while (fiber) {
		yield* walkFiberTree(fiber);
		fiber = fiber.sibling;
	}
	yield returnFiber;
}

export function createFiber(element, key, pKeys = []) {
	const nodeKey = Fiber.genNodeKey(key, pKeys);

	if (Fiber.ExistPool.has(nodeKey)) {
		const fiber = Fiber.ExistPool.get(nodeKey);
		fiber.pendingProps = element.props;
		fiber.flags &= Update;
		fiber.flags |= MarkReusableFiber;
		fiber.deletions = [];

		fiber.sibling = null;
		fiber.return = null;

		return fiber;
	}

	const fiber = new Fiber(element, key, pKeys);
	Fiber.ExistPool.set(nodeKey, fiber);
	return fiber;
}

const ConquerFiberQueue = [];
const collectConquerFiber = (fiber) => {
	ConquerFiberQueue.push(fiber);
};

const findPreConquerFiber = (index, checker = checkTrue) => {
	for (let i = index - 1; -1 < i; i--) {
		const fiber = ConquerFiberQueue[i];
		if (checker(fiber)) {
			return fiber;
		}
	}
};

const findParentFiber = (fiber, checker = checkTrue) => {
	while (fiber.return) {
		if (checker(fiber.return)) {
			return fiber.return;
		}
		fiber = fiber.return;
	}
};

function beginWork(returnFiber) {
	const children = returnFiber.normalChildren;
	const result = [];

	const oldFiberMap = new Map();
	// child 还保留着旧子fiber的引用，用来收集 deletions
	for (const child of walkChildFiber(returnFiber)) {
		oldFiberMap.set(child.nodeKey, child);
	}
	returnFiber.child = null;

	let preFiber = null;
	let preOldIndex = -1;
	for (let index = 0; index < children.length; index++) {
		const element = children[index];
		const key = `${element.type.name || element.type}#${element.key || index}`;
		const pKeys = [...returnFiber.pKeys, returnFiber.key];
		const fiber = createFiber(element, key, pKeys);
		fiber.index = index;
		fiber.return = returnFiber;
		oldFiberMap.delete(fiber.nodeKey);

		if (
			fiber.oldIndex <= preOldIndex ||
			fiber.memoizedProps.__target !== fiber.pendingProps.__target
		) {
			fiber.flags |= Placement;
		} else {
			preOldIndex = fiber.oldIndex;
		}

		if (index === 0) {
			returnFiber.child = fiber;
		} else {
			preFiber.sibling = fiber;
		}

		if (!Fiber.isHostFiber(returnFiber)) {
			fiber.flags |= returnFiber.flags & Placement;
		}

		preFiber = fiber;
		result.push(fiber);
	}

	returnFiber.deletions = [...oldFiberMap.values()];
	if (returnFiber.deletions.length) {
		returnFiber.flags |= ChildDeletion;
	}

	return result;
}

export const placementFiber = (fiber, index) => {
	let parentHostFiber = findParentFiber(
		fiber,
		(f) => Fiber.isHostFiber(f) || f.stateNode
	);

	if (!parentHostFiber) {
		return;
	}

	// portal: __target
	if (!Fiber.isHostFiber(parentHostFiber)) {
		parentHostFiber.stateNode.appendChild(fiber.stateNode);
		return;
	}

	let preHostFiber = findPreConquerFiber(
		index,
		(f) => Fiber.isHostFiber(f) && !f.isDescendantOf(fiber)
	);

	if (preHostFiber && preHostFiber.isDescendantOf(parentHostFiber)) {
		parentHostFiber.stateNode.insertBefore(
			fiber.stateNode,
			preHostFiber.stateNode.nextSibling
		);
	} else {
		parentHostFiber.stateNode.insertBefore(
			fiber.stateNode,
			parentHostFiber.stateNode.firstChild
		);
	}
};

export const updateHostFiber = (fiber) => {
	if (fiber.type === 'text') {
		fiber.stateNode.data = fiber.memoizedState;
	} else {
		for (const [pKey, pValue] of Object.entries(fiber.memoizedState)) {
			if (pValue === void 0) {
				fiber.stateNode.removeAttribute(pKey);
			} else {
				fiber.stateNode.setAttribute(pKey, pValue);
			}
		}
	}
};

export const childDeletionFiber = (returnFiber) => {
	queueMacrotask(() => {
		for (const fiber of returnFiber.deletions) {
			for (const f of walkFiberTree(fiber)) {
				if (Fiber.isHostFiber(f)) {
					f.stateNode.remove();
				} else {
					console.log('UnMount Component', f.nodeKey);
				}
				Fiber.ExistPool.delete(f.nodeKey);
			}
		}
		returnFiber.deletions = [];
	});
};

function finishedWork(fiber) {
	collectConquerFiber(fiber);
	if (!fiber.inStateChangeScope) {
		return;
	}

	const oldProps = { ...(fiber.memoizedProps || {}) };
	const newProps = fiber.pendingProps || {};

	if (fiber.type === 'text') {
		if (!oldProps || newProps.content !== oldProps.content) {
			fiber.memoizedState = newProps.content;
			fiber.flags |= Update;
		}
	} else if (isHTMLTag(fiber.type)) {
		const attrs = {};
		for (const [pKey, pValue] of Object.entries(newProps)) {
			const oldPValue = oldProps[pKey];
			delete oldProps[pKey];
			// todo
			fixUnBubbleEvent(fiber.stateNode, pKey, pValue);

			if (
				pValue !== oldPValue &&
				pKey !== 'children' &&
				pKey !== 'ref' &&
				!pKey.match(/^on[A-Z]/)
			) {
				const isBoolean = isSpecialBooleanAttr(pKey);
				if (pValue == null || (isBoolean && !includeBooleanAttr(pValue))) {
					attrs[pKey] = void 0;
				} else {
					attrs[pKey] = isBoolean ? '' : pValue;
				}
			}
		}

		for (const [pKey] of Object.entries(oldProps)) {
			if (pKey !== 'children' && pKey !== 'ref' && !pKey.match(/^on[A-Z]/)) {
				attrs[pKey] = void 0;
			}
		}

		// todo 修改位置
		fiber.memoizedState = attrs;

		if (Object.keys(fiber.memoizedState).length) {
			fiber.flags |= Update;
		}
	} else {
		if (!objectEqual(fiber.memoizedProps, fiber.pendingProps)) {
			fiber.flags |= Update;
		}
	}

	fiber.memoizedProps = fiber.pendingProps;
}

function* walkFiber(returnFiber) {
	const fiberList = beginWork(returnFiber);

	for (const fiber of fiberList) {
		if (fiber.type === 'text') {
			finishedWork(fiber);
			yield fiber;
		} else {
			yield* walkFiber(fiber);
		}
	}

	finishedWork(returnFiber);
	yield returnFiber;
}

const commitRoot = () => {
	let i = 0;
	const len = ConquerFiberQueue.length;

	while (i < len) {
		const fiber = ConquerFiberQueue[i];

		if (Fiber.isHostFiber(fiber)) {
			fiber.stateNode[elementPropsKey] = fiber.memoizedProps;
		} else {
			console.log('Committing Component', fiber.nodeKey);
		}

		if ((fiber.flags & Placement) !== NoFlags) {
			if (Fiber.isHostFiber(fiber)) {
				placementFiber(fiber, i);
			} else {
				console.log(
					`${
						(fiber.flags & MarkReusableFiber) !== NoFlags
							? 'Placement'
							: 'Mount'
					} Component`,
					fiber.nodeKey
				);
			}

			fiber.flags &= ~Placement;
		}

		if ((fiber.flags & Update) !== NoFlags) {
			if (Fiber.isHostFiber(fiber)) {
				updateHostFiber(fiber);
			} else {
				console.log('Update Component', fiber.nodeKey);
			}
			fiber.flags &= ~Update;
		}

		if ((fiber.flags & ChildDeletion) !== NoFlags) {
			childDeletionFiber(fiber);
			fiber.flags &= ~ChildDeletion;
		}

		fiber.flags = NoFlags;
		i += 1;
	}

	ConquerFiberQueue.length = 0;
};

const renderSetFiber = new Set();
function forceRender() {
	const cursorFix = genCursorFix();

	for (const fiber of renderSetFiber) {
		fiber.flags |= Update;
	}

	innerRender(getRootFiber());
	cursorFix();
}

export const pushRenderFiber = (fiber) => {
	renderSetFiber.add(fiber);
	queueMicrotaskOnce(forceRender);
};

export const innerRender = (renderRootFiber) => {
	for (const fiber of walkFiber(renderRootFiber)) {
		if (!Fiber.isHostFiber(fiber)) {
			queueMacrotask(fiber.flushEffects);
			console.count('innerRender');
		}
	}

	commitRoot(renderRootFiber);
};

/* #region 事件相关 */
export const elementPropsKey = '__props';
const eventTypeMap = {
	click: ['onClickCapture', 'onClick']
};

function getEventCallbackNameFromEventType(eventType) {
	return eventTypeMap[eventType];
}

function collectPaths(targetElement, container, eventType) {
	const paths = {
		capture: [],
		bubble: []
	};

	while (targetElement && targetElement !== container) {
		// 收集
		let elementProps = targetElement[elementPropsKey];

		if (elementProps) {
			// click -> onClick onClickCapture
			const callbackNameList = getEventCallbackNameFromEventType(eventType);
			if (callbackNameList) {
				callbackNameList.forEach((callbackName, i) => {
					const eventCallback = elementProps[callbackName];
					if (eventCallback) {
						if (i === 0) {
							paths.capture.unshift(eventCallback);
						} else {
							paths.bubble.push(eventCallback);
						}
					}
				});
			}
		}
		targetElement = targetElement.parentNode;
	}
	return paths;
}

function createSyntheticEvent(e) {
	const syntheticEvent = e;
	syntheticEvent.__stopPropagation = false;
	const originStopPropagation = e.stopPropagation;

	syntheticEvent.stopPropagation = () => {
		syntheticEvent.__stopPropagation = true;
		if (originStopPropagation) {
			originStopPropagation();
		}
	};
	return syntheticEvent;
}

function triggerEventFlow(paths, se) {
	for (let i = 0; i < paths.length; i++) {
		const callback = paths[i];
		callback.call(null, se);
		if (se.__stopPropagation) {
			break;
		}
	}
}

function dispatchEvent(container, eventType, e) {
	const targetElement = e.target;

	if (!targetElement) {
		return console.warn('事件不存在target', e);
	}

	// 1. 收集沿途的事件
	const { bubble, capture } = collectPaths(targetElement, container, eventType);

	// 2. 构造合成事件
	const se = createSyntheticEvent(e);

	// 3. 遍历capture
	triggerEventFlow(capture, se);

	if (!se.__stopPropagation) {
		// 4. 遍历bubble
		triggerEventFlow(bubble, se);
	}
}

export function initEvent(container, eventType) {
	container.addEventListener(eventType, (e) => {
		dispatchEvent(container, eventType, e);
	});
}

let __rootFiber = null;
export const getRootFiber = () => __rootFiber;

export const createRoot = (container) => {
	const key = container.id || (Date.now() + Math.random()).toString(36);

	Object.keys(eventTypeMap).forEach((eventType) => {
		initEvent(container, eventType);
	});

	return {
		render(element) {
			const rootFiber = createFiber(
				{
					type: container.tagName.toLowerCase(),
					props: { children: element, __target: container }
				},
				key
			);
			rootFiber.flags |= Update;
			__rootFiber = rootFiber;
			innerRender(rootFiber);
		}
	};
};

window.Fiber = Fiber;
