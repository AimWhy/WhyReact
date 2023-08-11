export const makeMap = (list) => {
	const map = Object.create(null);
	for (let i = 0; i < list.length; i++) {
		map[list[i]] = true;
	}
	return (val) => !!map[val];
};

export const shallowEqual = (object1, object2) => {
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

export const HTML_TAGS = [
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

export const isHTMLTag = makeMap(HTML_TAGS);

const specialBooleanAttrs = [
	'itemscope',
	'allowfullscreen',
	'formnovalidate',
	'ismap',
	'nomodule',
	'novalidate',
	'readonly'
];

export const isSpecialBooleanAttr = makeMap(specialBooleanAttrs);

export const includeBooleanAttr = (value) => !!value || value === '';

const optionsModifierRE = /(?:Once|Passive|Capture)$/;
export const parseEventName = (name) => {
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

export const genCursorFix = () => {
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
