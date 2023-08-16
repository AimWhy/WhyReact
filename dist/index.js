(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.WhyReact = {}));
})(this, (function (exports) { 'use strict';

	const makeMap$1 = (list) => {
		const memoSet = new Set(list);
		return (val) => memoSet.has(val);
	};

	const shallowEqual = (object1, object2) => {
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
			if (object1[key] !== object2[key]) {
				return false;
			}
		}

		return true;
	};

	const specialBooleanAttrs = [
		'itemscope',
		'allowfullscreen',
		'formnovalidate',
		'ismap',
		'nomodule',
		'novalidate',
		'readonly'
	];

	makeMap$1(specialBooleanAttrs);

	const genCursorFix = () => {
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

	function onCompositionStart(e) {
		e.target.composing = true;
	}
	function onCompositionEnd(e) {
		const target = e.target;
		if (target.composing) {
			target.composing = false;
			target.dispatchEvent(new Event('input'));
		}
	}
	function onInputFixed(fun) {
		return function (e) {
			if (!e.target.composing) {
				fun(e);
			}
		};
	}

	function fixProps(oldProps) {
		const newProps = { ...oldProps };
		if ('onInput' in newProps) {
			newProps['onCompositionstart'] = onCompositionStart;
			newProps['onCompositionend'] = onCompositionEnd;
			newProps['onChange'] = onCompositionEnd;
			newProps['onInput'] = onInputFixed(newProps['onInput']);
		}
		return newProps;
	}

	function genBuildInElementFun($tag) {
		const func = function (props = {}, oldProps = {}, context) {
			const { instance, useState, useEffect } = context;
			oldProps = fixProps(oldProps);
			props = fixProps(props);

			const [invokers] = useState({});
			const element = instance || document.createElement($tag);
			const deleteMap = { ...oldProps };
			element._fiberKey = this.key;
			element._fiber = this;

			for (const [pKey, pValue] of Object.entries(props)) {
				if (pKey.match(/^on[A-Z]/)) {
					const [eventName, options] = parseEventName(pKey);

					if (!invokers[pKey]) {
						invokers[pKey] = {
							raw: pValue,
							handler(event) {
								invokers[pKey].raw(event);
							}
						};

						element.addEventListener(eventName, invokers[pKey].handler, options);
					} else {
						invokers[pKey].raw = pValue;
					}

					delete deleteMap[pKey];
					continue;
				}

				delete deleteMap[pKey];
				if (pKey === 'children' || pKey === 'ref' || pKey === 'key') {
					continue;
				}
				if (pValue === oldProps[pKey]) {
					continue;
				}

				const isBoolean = isSpecialBooleanAttr(pKey);

				if (pValue == null || (isBoolean && !includeBooleanAttr(pValue))) {
					element.removeAttribute(pKey);
				} else {
					element.setAttribute(pKey, isBoolean ? '' : pValue);
				}
			}

			for (const [pKey, map] of Object.entries(deleteMap)) {
				if (pKey.match(/^on[A-Z]/)) {
					const [eventName, options] = parseEventName(pKey);
					element.removeEventListener(eventName, map.handler, options);
				} else {
					element.removeAttribute(pKey);
				}
			}

			useEffect(
				() => () => {
					for (const [pKey, map] of Object.entries(invokers)) {
						const [eventName, options] = parseEventName(pKey);
						element.removeEventListener(eventName, map.handler, options);
					}
					element.remove();
				},
				[]
			);

			return element;
		};

		Object.defineProperty(func, 'name', { value: $tag });
		return func;
	}

	function genBuildInTextFun($tag, creator) {
		const func = function (props, oldProps, context) {
			const { instance, useEffect } = context;
			const element = instance || creator(props.content);
			element._fiberKey = this.key;
			element._fiber = this;

			if (!oldProps || props.content !== oldProps.content) {
				element.data = props.content;
			}
			useEffect(
				() => () => {
					element.remove();
				},
				[]
			);

			return element;
		};

		Object.defineProperty(func, 'name', { value: $tag });
		return func;
	}

	const buildIn = {
		body: genBuildInElementFun('body'),
		html: genBuildInElementFun('html'),
		base: genBuildInElementFun('base'),
		head: genBuildInElementFun('head'),
		link: genBuildInElementFun('link'),
		meta: genBuildInElementFun('meta'),
		style: genBuildInElementFun('style'),
		title: genBuildInElementFun('title'),
		address: genBuildInElementFun('address'),
		article: genBuildInElementFun('article'),
		aside: genBuildInElementFun('aside'),
		footer: genBuildInElementFun('footer'),
		header: genBuildInElementFun('header'),
		hgroup: genBuildInElementFun('hgroup'),
		h1: genBuildInElementFun('h1'),
		h2: genBuildInElementFun('h2'),
		h3: genBuildInElementFun('h3'),
		h4: genBuildInElementFun('h4'),
		h5: genBuildInElementFun('h5'),
		h6: genBuildInElementFun('h6'),
		nav: genBuildInElementFun('nav'),
		section: genBuildInElementFun('section'),
		div: genBuildInElementFun('div'),
		dd: genBuildInElementFun('dd'),
		dl: genBuildInElementFun('dl'),
		dt: genBuildInElementFun('dt'),
		figcaption: genBuildInElementFun('figcaption'),
		figure: genBuildInElementFun('figure'),
		picture: genBuildInElementFun('picture'),
		hr: genBuildInElementFun('hr'),
		img: genBuildInElementFun('img'),
		li: genBuildInElementFun('li'),
		main: genBuildInElementFun('main'),
		ol: genBuildInElementFun('ol'),
		p: genBuildInElementFun('p'),
		pre: genBuildInElementFun('pre'),
		ul: genBuildInElementFun('ul'),
		a: genBuildInElementFun('a'),
		b: genBuildInElementFun('b'),
		abbr: genBuildInElementFun('abbr'),
		bdi: genBuildInElementFun('bdi'),
		bdo: genBuildInElementFun('bdo'),
		br: genBuildInElementFun('br'),
		cite: genBuildInElementFun('cite'),
		code: genBuildInElementFun('code'),
		data: genBuildInElementFun('data'),
		dfn: genBuildInElementFun('dfn'),
		em: genBuildInElementFun('em'),
		i: genBuildInElementFun('i'),
		kbd: genBuildInElementFun('kbd'),
		mark: genBuildInElementFun('mark'),
		q: genBuildInElementFun('q'),
		rp: genBuildInElementFun('rp'),
		rt: genBuildInElementFun('rt'),
		ruby: genBuildInElementFun('ruby'),
		s: genBuildInElementFun('s'),
		samp: genBuildInElementFun('samp'),
		small: genBuildInElementFun('small'),
		span: genBuildInElementFun('span'),
		strong: genBuildInElementFun('strong'),
		sub: genBuildInElementFun('sub'),
		sup: genBuildInElementFun('sup'),
		time: genBuildInElementFun('time'),
		u: genBuildInElementFun('u'),
		var: genBuildInElementFun('var'),
		wbr: genBuildInElementFun('wbr'),
		area: genBuildInElementFun('area'),
		audio: genBuildInElementFun('audio'),
		map: genBuildInElementFun('map'),
		track: genBuildInElementFun('track'),
		video: genBuildInElementFun('video'),
		embed: genBuildInElementFun('embed'),
		object: genBuildInElementFun('object'),
		param: genBuildInElementFun('param'),
		source: genBuildInElementFun('source'),
		canvas: genBuildInElementFun('canvas'),
		script: genBuildInElementFun('script'),
		noscript: genBuildInElementFun('noscript'),
		del: genBuildInElementFun('del'),
		ins: genBuildInElementFun('ins'),
		caption: genBuildInElementFun('caption'),
		col: genBuildInElementFun('col'),
		colgroup: genBuildInElementFun('colgroup'),
		table: genBuildInElementFun('table'),
		thead: genBuildInElementFun('thead'),
		tbody: genBuildInElementFun('tbody'),
		td: genBuildInElementFun('td'),
		th: genBuildInElementFun('th'),
		tr: genBuildInElementFun('tr'),
		button: genBuildInElementFun('button'),
		datalist: genBuildInElementFun('datalist'),
		fieldset: genBuildInElementFun('fieldset'),
		form: genBuildInElementFun('form'),
		input: genBuildInElementFun('input'),
		label: genBuildInElementFun('label'),
		legend: genBuildInElementFun('legend'),
		meter: genBuildInElementFun('meter'),
		optgroup: genBuildInElementFun('optgroup'),
		option: genBuildInElementFun('option'),
		output: genBuildInElementFun('output'),
		progress: genBuildInElementFun('progress'),
		select: genBuildInElementFun('select'),
		textarea: genBuildInElementFun('textarea'),
		details: genBuildInElementFun('details'),
		dialog: genBuildInElementFun('dialog'),
		menu: genBuildInElementFun('menu'),
		summary: genBuildInElementFun('summary'),
		template: genBuildInElementFun('template'),
		blockquote: genBuildInElementFun('blockquote'),
		iframe: genBuildInElementFun('iframe'),
		tfoot: genBuildInElementFun('tfoot')
	};

	const isHTMLTag = makeMap(Object.keys(buildIn));

	buildIn.text = genBuildInTextFun('text', (content) =>
		document.createTextNode(content)
	);
	buildIn.comment = genBuildInTextFun('comment', (content) =>
		document.createComment(content)
	);

	const isTextOrCommentTag = makeMap(['text', 'comment']);

	new Set(Object.values(buildIn));

	const buildInMap = buildIn;

	const resolvedPromise = Promise.resolve();
	const queueMicrotask =
		window.queueMicrotask ||
		((callback) => {
			if (typeof callback !== 'function') {
				throw new TypeError('The argument to queueMicrotask must be a function.');
			}

			resolvedPromise.then(callback);
		});

	const uniqueSet = new Set();
	const queueMicrotaskOnce = (func) => {
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
	const performWork = () => {
		if (scheduledCallbackQueue.length) {
			try {
				const work = scheduledCallbackQueue.shift();
				work();
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

	const channel = new MessageChannel();
	channel.port1.onmessage = performWork;
	const schedulePerform = () => channel.port2.postMessage(null);

	const queueMacrotask = (callback) => {
		scheduledCallbackQueue.push(callback);
		if (!isMessageLoopRunning) {
			isMessageLoopRunning = true;
			schedulePerform();
		}
	};

	const FiberStatus$1 = Enum({
		Mounted: 'Mounted',
		Updated: 'Updated'
	});

	const firstNextWithProps = (generatorFunction) => {
		return (func, pushRenderFiber) => {
			const generatorObject = generatorFunction(func, pushRenderFiber);

			generatorObject.next();

			const result = {
				next: (...args) => {
					return generatorObject.next(...args);
				},
				throw: (...args) => {
					return generatorObject.throw(...args);
				},

				//子 fiber 状态
				first: null,
				last: null,

				// 自身 fiber 状态
				oldIndex: -1,
				index: 0,
				previous: null,
				sibling: null,
				return: null,
				Status: FiberStatus$1.Mounted,

				// 继承 Element 数据
				type: func,
				key: null,
				props: {},
				children: null,

				// dom 数据
				stateNode: document.createDocumentFragment()
			};

			generatorObject.next(result);

			return result;
		};
	};

	const checkIfSnapshotChanged = ({ value, getSnapshot }) => {
		try {
			return value !== getSnapshot();
		} catch {
			return true;
		}
	};

	function* withStateFun(func, pushRenderFiber) {
		const self = yield;

		let StateIndex = 0;
		const hookQueue = [];

		const useState = (initialState) => {
			const innerIndex = StateIndex++;

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

					pushRenderFiber(self);
				}
			];
		};

		const effects = [];
		const cleanEffects = [];
		const useEffect = (effect, deps) => {
			const innerIndex = StateIndex++;
			const oldDeps = hookQueue[innerIndex] ? hookQueue[innerIndex][1] : NaN;

			if (hookQueue.length <= innerIndex) {
				hookQueue[innerIndex] = [effect, deps];
			} else {
				hookQueue[innerIndex][1] = deps;
			}

			if (deps == void 0) {
				effects.push(effect);
			} else if (Array.isArray(deps)) {
				if (!deps.length) {
					if (self.Status === FiberStatus$1.Mounted) {
						effects.push(effect);
						effect.mountDep = true;
					}
				} else {
					if (!shallowEqual(deps, oldDeps)) {
						effects.push(effect);
					}
				}
			}
		};

		const useSyncExternalStore = (subscribe, getSnapshot) => {
			const value = getSnapshot();
			const [{ inst }, forceUpdate] = useState({
				inst: { value, getSnapshot }
			});

			useEffect(() => {
				if (checkIfSnapshotChanged(inst)) {
					forceUpdate({ inst });
				}

				return subscribe(function handleStoreChange() {
					if (checkIfSnapshotChanged(inst)) {
						forceUpdate({ inst });
					}
				});
			}, [subscribe]);

			return value;
		};

		self.flushEffects = function flushEffects() {
			while (effects.length) {
				const current = effects.shift();
				const clean = current();

				if (typeof clean === 'function') {
					clean.mountDep = current.mountDep;
					cleanEffects.push(clean);
				}
			}
			self.Status = FiberStatus$1.Updated;
		};

		self.flushCleanEffects = function flushCleanEffects(isUnmounted) {
			const temp = [];

			while (cleanEffects.length) {
				const clean = cleanEffects.shift();
				const isUnmountClean = clean.mountDep;

				if (isUnmounted) {
					clean();
				} else {
					if (!isUnmountClean) {
						clean();
					} else {
						temp.push(clean);
					}
				}
			}
			if (isUnmounted) {
				props = void 0;
				effects.length = 0;
				cleanEffects.length = 0;
				hookQueue.length = 0;
			} else {
				cleanEffects.push(...temp);
			}
		};

		const hookMap = {
			useState,
			useEffect,
			useSyncExternalStore
		};

		let props = void 0;
		let newProps = (yield) || {};
		let result = null;

		while (true) {
			self.flushCleanEffects();

			StateIndex = 0;

			result = func.call(self, newProps, props, hookMap);

			props = newProps;

			newProps = yield result;

			hookMap.instance = result;
		}
	}

	const componentCreator = firstNextWithProps(withStateFun);

	function generator(pushRenderFiber, element) {
		const result = componentCreator(
			typeof element.type === 'function'
				? element.type
				: buildInMap[element.type],
			pushRenderFiber
		);
		return result;
	}

	function jsx(type, props = {}, key = null) {
		return { key, type, props };
	}

	function Fragment$1(props) {
		return props.children;
	}

	const renderSetFiber = new Set();
	const pushRenderFiber = (generatorObj) => {
		renderSetFiber.add(generatorObj);
		queueMicrotaskOnce(forceRender);
	};

	function* lastPositionFiber(fiber) {
		while (fiber) {
			if (fiber.type !== Fragment || !fiber.props.target) {
				yield fiber;
				yield* lastPositionFiber(fiber.last);
			}
			fiber = fiber.previous;
		}
	}

	function getPreviousNode(fiber) {
		const previous = fiber.previous;
		for (const temp of lastPositionFiber(previous)) {
			if (isHostElementFiber(temp)) {
				return temp.stateNode;
			}
		}
	}

	const getParentOrParentPreNode = (fiber) => {
		if (isHostElementFiber(fiber)) {
			return [true, fiber.stateNode];
		}

		let parentOrPreviousNode = getPreviousNode(fiber);

		while (!parentOrPreviousNode) {
			fiber = fiber.return;
			if (isHostElementFiber(fiber)) {
				return [true, fiber.stateNode];
			} else {
				parentOrPreviousNode = getPreviousNode(fiber);
			}
		}

		return [false, parentOrPreviousNode];
	};

	const insertNode = (fiber, preNode, [isParent, referNode]) => {
		if (fiber.Status === FiberStatus.Mounted || isHostElementFiber(fiber)) {
			if (preNode) {
				preNode.after(fiber.stateNode);
			} else if (isParent) {
				referNode.prepend(fiber.stateNode);
			} else {
				referNode.after(fiber.stateNode);
			}
		} else {
			(function fn(temp) {
				let first = temp.first;
				while (first) {
					if (isHostElementFiber(first)) {
						if (preNode) {
							preNode.after(first.stateNode);
						} else if (isParent) {
							referNode.prepend(first.stateNode);
						} else {
							referNode.after(first.stateNode);
						}
					} else {
						fn(first);
					}
					first = first.sibling;
				}
			})(fiber);
		}
	};

	function cleanSelfFiber(fiber) {
		fiber.oldIndex = fiber.index;
		fiber.Status = FiberStatus.Updated;

		fiber.index = 0;
		fiber.previous = null;
		fiber.sibling = null;
		fiber.return = null;
	}

	const FiberMap = new Map();

	const gen$1 = (element, key) => {
		let fiber = null;
		if (key !== void 0 && FiberMap.has(key)) {
			fiber = FiberMap.get(key);
			FiberMap.delete(key);
			cleanSelfFiber(fiber);
		} else {
			fiber = generator(pushRenderFiber, element);
		}

		fiber.key = key;
		fiber.props = element.props;
		return fiber;
	};

	function toChildren(children) {
		if (children === void 0) {
			return children;
		}
		return [].concat(children);
	}

	function beginWork(returnFiber) {
		let children = returnFiber.children;
		const pKey = returnFiber ? `${returnFiber.key}:` : '';

		if (!Array.isArray(children)) {
			children = [children];
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

		let result = [];
		for (let index = 0; index < children.length; index++) {
			let element = children[index];

			let key = pKey + (element.key || '');
			if (!element.key) {
				key = key + (element.type.name || element.type) + '_' + index;
			}

			let fiber = gen$1(element, key);
			if (isTextOrCommentTag(element.type)) {
				fiber.children = null;
			} else if (isHTMLTag(element.type)) {
				fiber.children = toChildren(fiber.props.children);
			} else {
				const innerRootElement = fiber.next(fiber.props).value;
				fiber.children = toChildren(innerRootElement);
			}

			if (index === 0) {
				returnFiber.first = fiber;
			} else {
				returnFiber.last.sibling = fiber;
				fiber.previous = returnFiber.last;
			}
			fiber.index = index;
			fiber.return = returnFiber;
			returnFiber.last = fiber;
			result.push(fiber);
		}
		return result;
	}

	function* postOrder(returnFiber) {
		const fiberList = beginWork(returnFiber);

		for (let fiber of fiberList) {
			if (!fiber.children || !fiber.children.length) {
				yield fiber;
			} else {
				yield* postOrder(fiber);
			}
		}

		yield returnFiber;
	}

	function mountFinishedWork(fiber) {
		if (!fiber.return) {
			return;
		}
		if (isHostElementFiber(fiber)) {
			const temp = fiber.next(fiber.props).value;
			if (temp.nodeType !== 3 && temp.nodeType !== 8) {
				temp.appendChild(fiber.stateNode);
			}
			fiber.stateNode = temp;
		}

		if (fiber.type === Fragment && fiber.props.target) {
			fiber.props.target.appendChild(fiber.stateNode);
		} else {
			fiber.return.stateNode.appendChild(fiber.stateNode);
		}
	}

	function updateFinishedWork(fiber) {
		if (isHostElementFiber(fiber)) {
			fiber.stateNode = fiber.next(fiber.props).value;
		}

		if (!fiber.first) {
			return;
		}

		let childFiber = fiber.first;
		let preOldIndex = -1;
		while (childFiber) {
			if (fiber.Status === FiberStatus.Updated) {
				if (
					childFiber.Status === FiberStatus.Mounted ||
					childFiber.oldIndex < preOldIndex
				) {
					const preNode = getPreviousNode(childFiber);
					const referInfo = getParentOrParentPreNode(fiber);

					insertNode(childFiber, preNode, referInfo);
				}
			} else {
				fiber.stateNode.appendChild(childFiber.stateNode);

				if (fiber.type === Fragment && fiber.props.target) {
					fiber.props.target.appendChild(fiber.stateNode);
				}
			}
			preOldIndex = Math.max(childFiber.oldIndex, preOldIndex);
			childFiber = childFiber.sibling;
		}
	}

	const innerRender = (returnFiber) => {
		let result = null;
		const isUpdate = FiberMap.size > 0;

		for (const fiber of postOrder(returnFiber)) {
			// console.log('FinishedWork', fiber.key, fiber);
			// console.count('FinishedWork');
			if (isUpdate) {
				updateFinishedWork(fiber);
			} else {
				mountFinishedWork(fiber);
			}

			queueMacrotask(fiber.flushEffects);
			result = fiber;
		}

		if (FiberMap.size) {
			const unmounted = [...FiberMap.values()];
			queueMacrotask(() => {
				for (const dFiber of unmounted) {
					console.log('unmounted key', dFiber.key);
					dFiber.flushCleanEffects(true);
				}
			});
		}

		return result;
	};

	const walkFiber = (fiber, fun) => {
		fun(fiber);

		let first = fiber.first;
		while (first) {
			walkFiber(first, fun);
			first = first.sibling;
		}
	};

	function forceRender() {
		// console.clear();
		const cursorFix = genCursorFix();
		const realRenderFiberSet = new Set([...renderSetFiber]);

		for (const fiber of renderSetFiber) {
			let parent = fiber.return;
			while (parent) {
				if (realRenderFiberSet.has(parent)) {
					realRenderFiberSet.delete(fiber);
					break;
				}
				parent = parent.return;
			}
		}
		renderSetFiber.clear();

		for (const fiber of realRenderFiberSet) {
			walkFiber(fiber, (f) => FiberMap.set(f.key, f));
			FiberMap.delete(fiber.key);

			const innerRootElement = fiber.next(fiber.props).value;
			fiber.children = toChildren(innerRootElement);
			innerRender(fiber);
			FiberMap.clear();
		}

		cursorFix();
	}

	const createRoot = (container) => {
		const key = container.id || (Date.now() + Math.random()).toString(36);

		return {
			render(element) {
				const rootElement = jsx(
					container.tagName.toLowerCase(),
					{
						children: element
					},
					key
				);

				const rootFiber = gen(rootElement, key);
				rootFiber.stateNode = container;
				rootFiber.children = rootElement.props.children;

				innerRender(rootFiber);
			}
		};
	};

	exports.Fragment = Fragment$1;
	exports.createRoot = createRoot;
	exports.jsx = jsx;

}));
