import { innerRender, gen } from './workLoop';
import { jsx, Fragment } from './jsx-runtime';

const createRoot = (container) => {
	const key = container.id || (Date.now() + Math.random()).toString(36);

	return {
		render(element) {
			const rootElement = jsx(
				container.tagName.toLowerCase(),
				{
					children: element
				},
				key
			);

			const rootFiber = gen(rootElement, key);
			rootFiber.pendingProps = rootElement.props;
			rootFiber.stateNode = container;
			rootFiber.children = rootElement.props.children;

			innerRender(rootFiber);
		}
	};
};

export { jsx, Fragment, createRoot };
