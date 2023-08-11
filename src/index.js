import { innerRender, toValidElement } from './workLoop';
import { jsx, Fragment } from './jsx-runtime';

const createRoot = (container) => {
	const key = container.id || (Date.now() + Math.random()).toString(36);

	return {
		render(element) {
			element.key = element.key || key;
			element.stateNode = container;
			innerRender(element, new Set());
		}
	};
};

export { jsx, Fragment, createRoot, toValidElement };
