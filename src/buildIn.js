import {
	HTML_TAGS,
	parseEventName,
	isSpecialBooleanAttr,
	includeBooleanAttr
} from './util';

export const isTextOrCommentElement = (element) =>
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

		if (__DEV__) {
			console.log(`${$tag} 重用`, instance);
		}
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

					element.addEventListener(eventName, invokers[pKey].handler, options);
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
		if (__DEV__) {
			console.log(`comment 重用`, instance);
		}
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
		if (__DEV__) {
			console.log(`text 重用`, instance);
		}
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

const HostElementSet = new Set(Object.values(buildIn));

export const isHostElementFn = (func) => HostElementSet.has(func);

export const buildInMap = buildIn;
