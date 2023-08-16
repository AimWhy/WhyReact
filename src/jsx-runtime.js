export function jsx(type, props = {}, key = null) {
	return { key, type, props };
}

export function Fragment(props) {
	return props.children;
}
