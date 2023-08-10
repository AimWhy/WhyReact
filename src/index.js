import { innerRender, jsx, Fragment, toValidElement } from './jsx';

const createRoot = (container) => {
	const key = container.id || (Date.now() + Math.random()).toString(36);

	return {
		render(element) {
			element.key = element.key || key;

			innerRender(element, new Set());

			container.appendChild(element.stateNode);
		}
	};
};

const jsxDEV = jsx;
export { jsx, Fragment, createRoot, toValidElement, jsxDEV };
