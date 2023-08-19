export function jsx(type, props = {}, key = null) {
	return { key, type, props };
}

export function Fragment(props) {
	return props.children;
}

export const isPortal = (fiber) =>
	fiber.type === Fragment && fiber.props.target;
