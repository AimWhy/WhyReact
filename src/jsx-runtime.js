export const genKey = (element) => {
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

export function jsx(type, props = {}, key = null) {
	return {
		key,
		type,
		props
	};
}

export function Fragment(props) {
	return props.children;
}
