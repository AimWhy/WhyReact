(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["jsx-runtime"] = {}));
})(this, (function (exports) { 'use strict';

	function jsx(type, props = {}, key = null) {
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
			}
		};
	}

	const toValidElement = (element) => {
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

	const Fragment = () => {
		return document.createDocumentFragment();
	};

	exports.Fragment = Fragment;
	exports.jsx = jsx;
	exports.toValidElement = toValidElement;

}));
