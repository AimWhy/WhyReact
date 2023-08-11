export function jsx(type, props = {}, key = null) {
	return {
		key,
		type,
		props,

		child: null,
		sibling: null,
		return: null,
		index: 0,

		stateNode: null,

		get _key() {
			const typeName =
				typeof this.type === 'string' ? this.type : this.type.name;
			const pKey = this.return ? this.return._key : '';
			const cKey = this.key || `${typeName}_${this.index}`;
			return `${pKey}:${cKey}`;
		}
	};
}
