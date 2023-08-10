import { isHTMLTag, genCursorFix, getCommentRang } from './util';
import { queueMacrotask, queueMicrotaskOnce } from './taskQueue';
import { buildInMap, isTextElement } from './buildIn';
import {
	NoneLane,
	MountedLane,
	UnMountedLane,
	GeneratorPool,
	componentCreator
} from './generator';

export function jsx(type, props = {}, key = null) {
	return {
		key,
		type,
		props,

		child: null,
		sibling: null,
		return: null,
		index: 0,

		stateNode: null,
		get _key() {
			const typeName =
				typeof this.type === 'string' ? this.type : this.type.name;
			const pKey = this.return ? this.return._key : '';
			const cKey = this.key || `${typeName}_${this.index}`;
			return `${pKey}:${cKey}`;
		},
		get generator() {
			if (!GeneratorPool[this._key]) {
				GeneratorPool[this._key] = componentCreator(
					typeof this.type === 'string' ? buildInMap[this.type] : this.type,
					pushRenderElement
				);
				GeneratorPool[this._key].element = this;
			}
			if (GeneratorPool[this._key].StatusLane & (NoneLane | UnMountedLane)) {
				GeneratorPool[this._key].StatusLane = MountedLane;
			}
			return GeneratorPool[this._key];
		}
	};
}

export const Fragment = () => {
	return document.createDocumentFragment();
};

export const toValidElement = (element) => {
	if (element && element.type) {
		return element;
	}
	if (typeof element === 'string' || typeof element === 'number') {
		return jsx('text', { content: element });
	}
	if (Array.isArray(element)) {
		return jsx(Fragment, { children: element.flat(5) });
	}
	return jsx('text', { content: '' });
};

function beginWork(element) {
	if (!element.stateNode) {
		element.stateNode = document.createDocumentFragment();
	} else {
		console.log('%c 更新的根节点"', 'color:#0f0;', element);
	}

	if (typeof element.type === 'function' && element.type !== Fragment) {
		element.stateNode.appendChild(
			buildInMap.comment({ content: '^' + element._key })
		);
	}
}

function finishedWork(element) {
	console.log('finishedWork', element);
	if (isTextElement(element)) {
		element.stateNode = element.generator.next(element.props).value;
	} else if (isHTMLTag(element.type) || element.type === Fragment) {
		const temp = element.generator.next(element.props).value;
		temp.appendChild(element.stateNode);
		element.stateNode = temp;
	} else {
		element.stateNode.appendChild(
			buildInMap.comment({ content: element._key + '$' })
		);
	}

	if (element.type === Fragment && element.props.target) {
		element.props.target.appendChild(element.stateNode);
	} else if (element.return && element.return.stateNode) {
		element.return.stateNode.appendChild(element.stateNode);
	}
}

function* postOrder(element) {
	beginWork(element);

	if (isTextElement(element)) {
		yield element;
	} else if (isHTMLTag(element.type) || element.type === Fragment) {
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
					}
					prevSibling = child;
					yield* postOrder(child);
				}
			}
		}

		yield element;
	} else {
		const tempInnerRoot = element.generator.next(element.props).value;
		if (tempInnerRoot != null) {
			const innerRootElement = toValidElement(tempInnerRoot);
			element.child = innerRootElement;
			innerRootElement.return = element;
			innerRootElement.index = 0;

			yield* postOrder(innerRootElement);
		}

		yield element;
	}
}

export const innerRender = (element, deleteKeySet) => {
	console.clear();
	console.log('%c innerRender"', 'color:#0f0;', element);

	for (const item of postOrder(element)) {
		finishedWork(item);
		deleteKeySet.delete(item._key);
		if (item.generator.flushEffects) {
			queueMacrotask(item.generator.flushEffects);
		}
	}

	for (const item of deleteKeySet.keys()) {
		if (GeneratorPool[item]) {
			GeneratorPool[item].StatusLane = UnMountedLane;
			GeneratorPool[item].flushCleanEffects(true);
		}
	}

	console.log('deleteKeySet', deleteKeySet);
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

const renderList = new Set();
const pushRenderElement = (generator) => {
	renderList.add(generator);
	queueMicrotaskOnce(forceRender);
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

export const forceRender = () => {
	const cursorFix = genCursorFix();

	const element = getCommonRenderElement();
	const [startComment, endComment] = getCommentRang(element._key);
	// 删除旧的注释节点
	const range = document.createRange();
	range.setStartAfter(startComment);
	range.setEndAfter(endComment);
	range.deleteContents();

	let returnStateNode;
	if (element.return) {
		returnStateNode = element.return.stateNode;
		element.return.stateNode = null;
	}

	const existKeySet = new Set();
	elementWalker(element, (el) => {
		existKeySet.add(el._key);
	});

	innerRender(element, existKeySet);

	if (element.return) {
		element.return.stateNode = returnStateNode;
	}

	startComment.parentNode.insertBefore(element.stateNode, startComment);

	startComment.remove();
	cursorFix();
};
