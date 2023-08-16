export const makeMap = (list) => {
	const memoSet = new Set(list);
	return (val) => memoSet.has(val);
};

export const Enum = (baseEnum) => {
	return new Proxy(baseEnum, {
		get(target, name) {
			if (!Object.prototype.hasOwnProperty.call(baseEnum, name)) {
				throw new Error(`"${name}" value does not exist in the enum`);
			}
			return baseEnum[name];
		},
		set() {
			throw new Error('Cannot add a new value to the enum');
		}
	});
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
	let options = void 0;
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

	// 重新定位焦点, 恢复选择位置
	return () => {
		focusedElement.focus();
		focusedElement.selectionStart = start;
		focusedElement.selectionEnd = end;
	};
};
