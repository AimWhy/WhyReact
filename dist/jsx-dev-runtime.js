(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["jsx-dev-runtime"] = {}));
})(this, (function (exports) { 'use strict';

	function jsx(type, props = {}, key = null) {
		return { key, type, props };
	}

	function Fragment(props) {
		return props.children;
	}

	exports.Fragment = Fragment;
	exports.jsx = jsx;

}));
