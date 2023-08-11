import { isHTMLTag, genCursorFix } from './util';
import { queueMacrotask, queueMicrotaskOnce } from './taskQueue';
import { isTextOrCommentElement } from './buildIn';
import {
	UnMountedLane,
	MountedLane,
	GeneratorPool,
	generator
} from './generator';
import { jsx } from './jsx-runtime';

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

const insertNode = () => {};

export const gen = (element) => generator(pushRenderElement, element);

let isMounted = true;
function beginWork(element) {
	if (!element.stateNode) {
		element.stateNode = document.createDocumentFragment();
	} else if (__DEV__) {
		console.log('%c 更新的根节点"', 'color:#0f0;', element);
	}
}

function finishedWork(element) {
	if (__DEV__) {
		console.log('finishedWork', element);
	}
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

export const innerRender = (element, deleteKeySet) => {
	isMounted = !deleteKeySet.size;
	if (__DEV__) {
		console.clear();
		console.log('%c innerRender"', 'color:#0f0;', element);
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
	if (__DEV__) {
		console.log('deleteKeySet', deleteKeySet);
	}
};

export const elementWalker = (element, fun) => {
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

export const toValidElement = (element) => {
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

export function forceRender() {
	const cursorFix = genCursorFix();

	const element = getCommonRenderElement();

	const existKeySet = new Set();
	elementWalker(element, (el) => {
		existKeySet.add(el._key);
	});

	innerRender(element, existKeySet);

	cursorFix();
}
