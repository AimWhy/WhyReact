import { genCursorFix } from './util';
import { queueMacrotask, queueMicrotaskOnce } from './taskQueue';
import { isHTMLTag, isTextOrCommentTag, isHostElementFiber } from './buildIn';
import { generator, FiberStatus } from './generator';
import { jsx, Fragment } from './jsx-runtime';

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

export const gen = (element, key) => {
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

		let fiber = gen(element, key);
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

export const innerRender = (returnFiber) => {
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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for (const [dKey, dFiber] of FiberMap) {
			if (dFiber.return && dFiber.return.first === dFiber) {
				dFiber.return.first = dFiber.return.last = null;
			}
			// console.log('unmounted key', dKey);
			queueMacrotask(() => {
				dFiber.flushCleanEffects(true);
			});
		}
	}

	return result;
};

const walkFiber = (fiber, fun) => {
	const queue = [fiber.first];
	// dom 删除时从上到下分层来
	while (queue.length) {
		let first = queue.shift();
		while (first) {
			fun(first);
			if (first.first) {
				queue.push(first.first);
			}
			first = first.sibling;
		}
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
		FiberMap.clear();
		walkFiber(fiber, (f) => FiberMap.set(f.key, f));
		console.log(FiberMap);
		const innerRootElement = fiber.next(fiber.props).value;
		fiber.children = toChildren(innerRootElement);
		innerRender(fiber);
		FiberMap.clear();
	}

	cursorFix();
}
