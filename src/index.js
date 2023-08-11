import { innerRender, toValidElement, Fragment } from './workLoop';
import { jsx } from './jsx-runtime';

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

export { jsx, Fragment, createRoot, toValidElement };
