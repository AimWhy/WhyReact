(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["jsx-runtime"] = {}));
})(this, (function (exports) { 'use strict';

	const genKey = (element) => {
		let pKey = '';
		if (element.return) {
			pKey = element.return._key + ':';
		}

		let cKey = element.key;
		if (!cKey) {
			const typeName = element.type.name || element.type;
			const index = element.index ? '_' + element.index : '';
			cKey = `${typeName}${index}`;
		}

		return `${pKey}${cKey}`;
	};

	function jsx(type, props = {}, key = null) {
		return {
			key,
			type,
			props,

			child: null,
			previous: null,
			sibling: null,
			return: null,
			index: 0,

			stateNode: null,

			get _key() {
				return genKey(this);
			}
		};
	}

	function Fragment(props) {
		return props.children;
	}

	exports.Fragment = Fragment;
	exports.genKey = genKey;
	exports.jsx = jsx;

}));
