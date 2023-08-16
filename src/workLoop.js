import { genCursorFix, objectEqual, nextTickClearEqualMemo } from './util';
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
			let last = temp.last;
			while (last) {
				if (isHostElementFiber(last)) {
					if (preNode) {
						preNode.after(last.stateNode);
					} else if (isParent) {
						referNode.prepend(last.stateNode);
					} else {
						referNode.after(last.stateNode);
					}
				} else {
					fn(last);
				}
				last = last.previous;
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

function cleanChildFiber(fiber) {
	fiber.first = null;
	fiber.last = null;
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
		fiber.reuse = false;
	}

	fiber.key = key;
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

		if (fiber.reuse === false) {
			cleanChildFiber(fiber);
		} else {
			if (objectEqual(fiber.props, element.props, true)) {
				fiber.reuse = true;
				walkFiber(fiber, (f) => {
					f.oldIndex = f.index;
					FiberMap.delete(f.key);
				});
				// console.log('reuse:' + fiber.key, element);
			} else {
				cleanChildFiber(fiber);
			}
		}
		fiber.props = element.props;

		if (fiber.reuse !== true) {
			if (isTextOrCommentTag(element.type)) {
				fiber.children = null;
			} else if (isHTMLTag(element.type)) {
				fiber.children = toChildren(fiber.props.children);
			} else {
				const innerRootElement = fiber.next(fiber.props).value;
				fiber.children = toChildren(innerRootElement);
			}
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
		if (!fiber.children || !fiber.children.length || fiber.reuse === true) {
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

	if (!fiber.first || fiber.reuse === true) {
		return;
	}

	let childFiber = fiber.first;
	let preOldIndex = -1;
	while (childFiber) {
		if (childFiber.type === Fragment && childFiber.props.target) {
			// reuse 清空跳过了
		} else if (fiber.Status === FiberStatus.Updated) {
			if (
				childFiber.Status === FiberStatus.Mounted ||
				childFiber.oldIndex <= preOldIndex
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
	nextTickClearEqualMemo();

	for (const fiber of postOrder(returnFiber)) {
		// console.log('FinishedWork', fiber.key, fiber);
		// console.count('FinishedWork');
		if (isUpdate) {
			updateFinishedWork(fiber);
		} else {
			mountFinishedWork(fiber);
		}
		delete fiber.reuse;
		queueMacrotask(fiber.flushEffects);
		result = fiber;
	}

	if (FiberMap.size) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for (const [dKey, dFiber] of FiberMap) {
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

	const deleteFiber = new Set();
	for (const fiber of renderSetFiber) {
		let parent = fiber.return;
		while (parent) {
			if (realRenderFiberSet.has(parent)) {
				realRenderFiberSet.delete(fiber);
				deleteFiber.add(fiber);
				break;
			}
			parent = parent.return;
		}
	}

	for (const fiber of deleteFiber) {
		let parent = fiber;
		while (!realRenderFiberSet.has(parent)) {
			parent.reuse = false;
			parent = parent.return;
		}
	}

	renderSetFiber.clear();

	for (const fiber of realRenderFiberSet) {
		FiberMap.clear();
		walkFiber(fiber, (f) => FiberMap.set(f.key, f));
		// console.log(FiberMap);
		const innerRootElement = fiber.next(fiber.props).value;
		fiber.children = toChildren(innerRootElement);
		innerRender(fiber);
		FiberMap.clear();
	}

	cursorFix();
}
