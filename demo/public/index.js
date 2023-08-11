(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined'
		? factory(exports)
		: typeof define === 'function' && define.amd
		? define(['exports'], factory)
		: ((global =
				typeof globalThis !== 'undefined' ? globalThis : global || self),
		  factory((global.WhyReact = {})));
})(this, function (exports) {
	'use strict';

	const makeMap = (list) => {
		const map = Object.create(null);
		for (let i = 0; i < list.length; i++) {
			map[list[i]] = true;
		}
		return (val) => !!map[val];
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

	const HTML_TAGS = [
		'html',
		'body',
		'base',
		'head',
		'link',
		'meta',
		'style',
		'title',
		'address',
		'article',
		'aside',
		'footer',
		'header',
		'hgroup',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'nav',
		'section',
		'div',
		'dd',
		'dl',
		'dt',
		'figcaption',
		'figure',
		'picture',
		'hr',
		'img',
		'li',
		'main',
		'ol',
		'p',
		'pre',
		'ul',
		'a',
		'b',
		'abbr',
		'bdi',
		'bdo',
		'br',
		'cite',
		'code',
		'data',
		'dfn',
		'em',
		'i',
		'kbd',
		'mark',
		'q',
		'rp',
		'rt',
		'ruby',
		's',
		'samp',
		'small',
		'span',
		'strong',
		'sub',
		'sup',
		'time',
		'u',
		'var',
		'wbr',
		'area',
		'audio',
		'map',
		'track',
		'video',
		'embed',
		'object',
		'param',
		'source',
		'canvas',
		'script',
		'noscript',
		'del',
		'ins',
		'caption',
		'col',
		'colgroup',
		'table',
		'thead',
		'tbody',
		'td',
		'th',
		'tr',
		'button',
		'datalist',
		'fieldset',
		'form',
		'input',
		'label',
		'legend',
		'meter',
		'optgroup',
		'option',
		'output',
		'progress',
		'select',
		'textarea',
		'details',
		'dialog',
		'menu',
		'summary',
		'template',
		'blockquote',
		'iframe',
		'tfoot'
	];

	const isHTMLTag = makeMap(HTML_TAGS);

	const specialBooleanAttrs = [
		'itemscope',
		'allowfullscreen',
		'formnovalidate',
		'ismap',
		'nomodule',
		'novalidate',
		'readonly'
	];

	const isSpecialBooleanAttr = makeMap(specialBooleanAttrs);

	const includeBooleanAttr = (value) => !!value || value === '';

	const optionsModifierRE = /(?:Once|Passive|Capture)$/;
	const parseEventName = (name) => {
		let options;
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

	const genCursorFix = () => {
		const focusedElement = document.activeElement;
		const start = focusedElement.selectionStart;
		const end = focusedElement.selectionEnd;

		return () => {
			// 重新定位焦点, 恢复选择位置
			focusedElement.focus();
			focusedElement.selectionStart = start;
			focusedElement.selectionEnd = end;
		};
	};

	const resolvedPromise = Promise.resolve();
	const queueMicrotask =
		window.queueMicrotask ||
		((callback) => {
			if (typeof callback !== 'function') {
				throw new TypeError(
					'The argument to queueMicrotask must be a function.'
				);
			}

			resolvedPromise.then(callback).catch((error) =>
				setTimeout(() => {
					throw error;
				}, 0)
			);
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

	const isTextOrCommentElement = (element) =>
		element.type === 'text' || element.type === 'comment';

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

	function inputWrap(fun) {
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
			newProps['onInput'] = inputWrap(newProps['onInput']);
		}
		return newProps;
	}

	function genBuildInFun($tag) {
		const func = function (
			props = {},
			oldProps = {},
			{ instance, useState, useEffect }
		) {
			oldProps = fixProps(oldProps);
			props = fixProps(props);

			const [invokers] = useState({});
			const element = instance || document.createElement($tag);
			const deleteMap = { ...oldProps };

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

						element.addEventListener(
							eventName,
							invokers[pKey].handler,
							options
						);
					} else {
						invokers[pKey].raw = pValue;
					}

					delete deleteMap[pKey];
					continue;
				}

				delete deleteMap[pKey];
				if ((pKey === 'children') | (pKey === 'ref') || pKey === 'key') {
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

	const buildIn = {
		comment(props, oldProps, { instance, useEffect }) {
			const element = instance || document.createComment(props.content);
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
		},
		text(props, oldProps, { instance, useEffect }) {
			const element = instance || document.createTextNode(props.content);
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
		}
	};

	HTML_TAGS.forEach((tag) => {
		buildIn[tag] = genBuildInFun(tag);
	});

	new Set(Object.values(buildIn));

	const buildInMap = buildIn;

	const NoneLane = 0b000001;
	const MountedLane = 0b000010;
	const UpdatedLane = 0b000100;
	const UnMountedLane = 0b001000;

	const GeneratorPool = new Map();

	const firstNextWithProps = (generatorFunction) => {
		return (...args) => {
			const generatorObject = generatorFunction(...args);

			generatorObject.next();

			const result = {
				next: (...args) => {
					return generatorObject.next(...args);
				},
				throw: (...args) => {
					return generatorObject.throw(...args);
				},
				return: (...args) => {
					return generatorObject.return(...args);
				},
				StatusLane: NoneLane
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

	function* withStateFun(func, pushRenderElement) {
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

					pushRenderElement(self);
				}
			];
		};

		const effects = [];
		const cleanEffects = [];
		const useEffect = (effect, deps) => {
			const innerIndex = StateIndex++;
			const oldEffect = hookQueue[innerIndex];
			hookQueue[innerIndex] = [effect, deps];

			if (deps == void 0) {
				return effects.push(effect);
			}

			if (self.StatusLane === MountedLane) {
				effects.push(effect);
				effect.mountDep = !deps.length;
			} else if (deps.length && !shallowEqual(deps, oldEffect[1])) {
				effects.push(effect);
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
			self.StatusLane = UpdatedLane;
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
			result = func.call(hookMap, newProps, props, hookMap);

			props = newProps;

			newProps = yield result;

			hookMap.instance = result;
		}
	}

	const componentCreator = firstNextWithProps(withStateFun);

	function generator(pushRenderElement, element) {
		if (!GeneratorPool[element._key]) {
			GeneratorPool[element._key] = componentCreator(
				typeof element.type === 'string'
					? buildInMap[element.type]
					: element.type,
				pushRenderElement
			);
			GeneratorPool[element._key].element = element;
		}
		if (GeneratorPool[element._key].StatusLane & (NoneLane | UnMountedLane)) {
			GeneratorPool[element._key].StatusLane = MountedLane;
		}
		return GeneratorPool[element._key];
	}

	const genKey = (element) => {
		let pKey = '';
		if (element.return) {
			pKey = element.return._key + ':';
		}

		let cKey = element.key;
		if (!cKey) {
			const typeName = element.type.name || element.type;
			const index = element.index ? '_' + element.index : '';
			cKey = `${typeName}${index}`;
		}

		return `${pKey}${cKey}`;
	};

	function jsx(type, props = {}, key = null) {
		return {
			key,
			type,
			props,

			child: null,
			previous: null,
			sibling: null,
			return: null,
			index: 0,

			stateNode: null,

			get _key() {
				return genKey(this);
			}
		};
	}

	function Fragment(props) {
		return props.children;
	}

	function InnerFragment() {
		return document.createDocumentFragment();
	}
	Object.defineProperty(InnerFragment, 'name', { value: 'F' });

	const wrapInnerFragment = (children, key) => {
		children = [
			jsx('comment', { content: '^' + key }),
			...[children].flat(5),
			jsx('comment', { content: key + `$` })
		];

		return jsx(InnerFragment, { children });
	};

	const renderList = new Set();
	const pushRenderElement = (generatorObj) => {
		renderList.add(generatorObj);
		queueMicrotaskOnce(forceRender);
	};

	function getElement(pElement) {
		let pNode = pElement.stateNode;
		if (typeof pElement.type === 'function') {
			if (pElement.type !== InnerFragment) {
				pElement = pElement.return;
			}
			let children = pElement.props.children;
			pNode = [children[0].stateNode, children[children.length - 1].stateNode];
		}

		return pNode;
	}

	const insertNode = (pElement, cElement) => {
		let pNode = getElement(pElement);

		let preNode = cElement.previous ? getElement(cElement.previous) : null;

		if (preNode) {
			if (Array.isArray(preNode)) {
				preNode[1].after(cElement.stateNode);
			} else {
				preNode.after(cElement.stateNode);
			}
		} else {
			if (Array.isArray(pNode)) {
				pNode[0].after(cElement.stateNode);
			} else {
				pNode.prepend(cElement.stateNode);
			}
		}
	};

	const gen = (element) => generator(pushRenderElement, element);

	let isMounted = true;
	function beginWork(element) {
		if (!element.stateNode) {
			element.stateNode = document.createDocumentFragment();
		} else {
			console.log('%c 更新的根节点"', 'color:#0f0;', element);
		}
	}

	function finishedWork(element) {
		console.log(element);
		if (isTextOrCommentElement(element)) {
			element.stateNode = gen(element).next(element.props).value;
		} else if (isHTMLTag(element.type) || element.type === InnerFragment) {
			const temp = gen(element).next(element.props).value;
			temp.appendChild(element.stateNode);
			element.stateNode = temp;
		}

		if (element.type === InnerFragment && element.props.target) {
			element.props.target.appendChild(element.stateNode);
		}

		if (!element.return) {
			return;
		}

		if (isMounted || gen(element.return).StatusLane & MountedLane) {
			element.return.stateNode.appendChild(element.stateNode);
			return;
		}

		if (gen(element).StatusLane & MountedLane) {
			insertNode(element.return, element);
			return;
		}
	}

	function* postOrder(element) {
		beginWork(element);

		if (isTextOrCommentElement(element)) {
			yield element;
		} else if (isHTMLTag(element.type) || element.type === InnerFragment) {
			let tempChildren = element.props.children;
			if (tempChildren) {
				if (!Array.isArray(tempChildren)) {
					tempChildren = [tempChildren];
				}

				if (tempChildren.length) {
					let index = 0;
					let prevSibling = null;

					for (const tempChild of tempChildren) {
						const child = toValidElement(tempChild);
						child.index = index;
						child.return = element;

						index = index + 1;
						if (!prevSibling) {
							element.child = child;
						} else {
							prevSibling.sibling = child;
							child.previous = prevSibling;
						}
						prevSibling = child;
						yield* postOrder(child);
					}
				}
			}

			yield element;
		} else {
			console.log(element);
			const tempInnerRoot = gen(element).next(element.props).value;

			const innerRootElement = wrapInnerFragment(tempInnerRoot, element._key);

			element.child = innerRootElement;
			innerRootElement.return = element;
			innerRootElement.index = 0;

			yield* postOrder(innerRootElement);

			yield element;
		}
	}

	const innerRender = (element, deleteKeySet) => {
		isMounted = !deleteKeySet.size;
		if (!isMounted) {
			console.error(element);
			let pReturn = element.return;
		}

		for (const item of postOrder(element)) {
			finishedWork(item);
			deleteKeySet.delete(item._key);
			if (gen(item).flushEffects) {
				queueMacrotask(gen(item).flushEffects);
			}
		}

		for (const item of deleteKeySet.keys()) {
			if (GeneratorPool[item]) {
				GeneratorPool[item].StatusLane = UnMountedLane;
				GeneratorPool[item].flushCleanEffects(true);
			}
		}
	};

	const elementWalker = (element, fun) => {
		let cursor = element;
		if (!cursor.child) {
			fun(cursor);
			return;
		}

		while (true) {
			while (cursor.child) {
				cursor = cursor.child;
			}
			while (!cursor.sibling) {
				fun(cursor);
				if (cursor === element) {
					return;
				}
				cursor = cursor.return;
			}
			fun(cursor);
			if (cursor === element) {
				return;
			}
			cursor = cursor.sibling;
		}
	};

	const toValidElement = (element) => {
		if (element && element.type) {
			return element;
		}
		if (typeof element === 'string' || typeof element === 'number') {
			return jsx('text', { content: element });
		}
		if (Array.isArray(element)) {
			return wrapInnerFragment(element, '');
		}
		return jsx('text', { content: '' });
	};

	const getCommonRenderElement = () => {
		const elements = [...renderList.values()].map((gen) => gen.element);
		renderList.clear();

		const parentMap = new Map();
		for (const el of elements) {
			let parent = el;

			while (parent) {
				const count = (parentMap.get(parent) || 0) + 1;
				if (count === elements.length) {
					return parent;
				}
				parentMap.set(parent, count);
				parent = parent.return;
			}
		}
	};

	function forceRender() {
		const cursorFix = genCursorFix();

		const element = getCommonRenderElement();

		const existKeySet = new Set();
		elementWalker(element, (el) => {
			existKeySet.add(el._key);
		});

		innerRender(element, existKeySet);

		cursorFix();
	}

	const createRoot = (container) => {
		const key = container.id || (Date.now() + Math.random()).toString(36);

		return {
			render(element) {
				element.key = element.key || key;
				element.stateNode = container;
				innerRender(element, new Set());
			}
		};
	};

	exports.Fragment = Fragment;
	exports.createRoot = createRoot;
	exports.jsx = jsx;
	exports.toValidElement = toValidElement;
});
