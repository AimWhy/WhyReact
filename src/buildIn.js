import {
	HTML_TAGS,
	parseEventName,
	isSpecialBooleanAttr,
	includeBooleanAttr
} from './util';

export const isTextElement = (element) => element.type === 'text';

function genBuildInFun($tag) {
	const func = function (
		props = {},
		oldProps = {},
		{ instance, useState, useEffect }
	) {
		const [invokers] = useState({});

		if (__DEV__) {
			console.log(`${$tag} 重用`, instance);
		}
		const element = instance || document.createElement($tag);
		element.innerHTML = '';
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
				element.remove(element);
			},
			[]
		);

		return element;
	};

	Object.defineProperty(func, 'name', { value: $tag });
	return func;
}

const buildIn = {
	comment(props) {
		return document.createComment(props.content);
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
				element.remove(element);
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
