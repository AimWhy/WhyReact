import { makeMap, parseEventName, isSpecialBooleanAttr } from './util';

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

export const isHTMLTag = makeMap(Object.keys(buildIn));

buildIn.text = genBuildInTextFun('text', (content) =>
	document.createTextNode(content)
);
buildIn.comment = genBuildInTextFun('comment', (content) =>
	document.createComment(content)
);

export const isTextOrCommentTag = makeMap(['text', 'comment']);

const HostElementSet = new Set(Object.values(buildIn));
export const isHostElementFiber = (fiber) => HostElementSet.has(fiber.type);

export const buildInMap = buildIn;
