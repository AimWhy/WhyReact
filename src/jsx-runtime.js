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

export function Fragment(props) {
	return props.children;
}
