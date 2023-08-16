import { objectEqual, Enum } from './util';
import { buildInMap } from './buildIn';

export const FiberStatus = Enum({
	Mounted: 'Mounted',
	Updated: 'Updated'
});

const firstNextWithProps = (generatorFunction) => {
	return (func, pushRenderFiber) => {
		const generatorObject = generatorFunction(func, pushRenderFiber);

		generatorObject.next();

		const result = {
			next: (...args) => {
				return generatorObject.next(...args);
			},
			throw: (...args) => {
				return generatorObject.throw(...args);
			},

			//子 fiber 状态
			first: null,
			last: null,

			// 自身 fiber 状态
			oldIndex: -1,
			index: 0,
			previous: null,
			sibling: null,
			return: null,
			Status: FiberStatus.Mounted,

			// 继承 Element 数据
			type: func,
			key: null,
			props: {},
			children: null,

			// dom 数据
			stateNode: document.createDocumentFragment()
		};

		generatorObject.next(result);

		return result;
	};
};

const checkIfSnapshotChanged = ({ value, getSnapshot }) => {
	try {
		return value !== getSnapshot();
	} catch {
		return true;
	}
};

function* withStateFun(func, pushRenderFiber) {
	const self = yield;

	let StateIndex = 0;
	const hookQueue = [];

	const useState = (initialState) => {
		const innerIndex = StateIndex++;

		if (hookQueue.length <= innerIndex) {
			if (typeof initialState === 'function') {
				initialState = initialState();
			}
			hookQueue[innerIndex] = initialState;
		}

		return [
			hookQueue[innerIndex],
			(newState) => {
				if (typeof newState === 'function') {
					const oldState = hookQueue[innerIndex];
					newState = newState(oldState);
				}
				hookQueue[innerIndex] = newState;

				pushRenderFiber(self);
			}
		];
	};

	const effects = [];
	const cleanEffects = [];
	const useEffect = (effect, deps) => {
		const innerIndex = StateIndex++;
		const oldDeps = hookQueue[innerIndex] ? hookQueue[innerIndex][1] : NaN;

		if (hookQueue.length <= innerIndex) {
			hookQueue[innerIndex] = [effect, deps];
		} else {
			hookQueue[innerIndex][1] = deps;
		}

		if (deps == void 0) {
			effects.push(effect);
		} else if (Array.isArray(deps)) {
			if (!deps.length) {
				if (self.Status === FiberStatus.Mounted) {
					effects.push(effect);
					effect.mountDep = true;
				}
			} else {
				if (!objectEqual(deps, oldDeps)) {
					effects.push(effect);
				}
			}
		}
	};

	const useSyncExternalStore = (subscribe, getSnapshot) => {
		const value = getSnapshot();
		const [{ inst }, forceUpdate] = useState({
			inst: { value, getSnapshot }
		});

		useEffect(() => {
			if (checkIfSnapshotChanged(inst)) {
				forceUpdate({ inst });
			}

			return subscribe(function handleStoreChange() {
				if (checkIfSnapshotChanged(inst)) {
					forceUpdate({ inst });
				}
			});
		}, [subscribe]);

		return value;
	};

	self.flushEffects = function flushEffects() {
		while (effects.length) {
			const current = effects.shift();
			const clean = current();

			if (typeof clean === 'function') {
				clean.mountDep = current.mountDep;
				cleanEffects.push(clean);
			}
		}
		self.Status = FiberStatus.Updated;
	};

	self.flushCleanEffects = function flushCleanEffects(isUnmounted) {
		const temp = [];

		while (cleanEffects.length) {
			const clean = cleanEffects.shift();
			const isUnmountClean = clean.mountDep;

			if (isUnmounted) {
				clean();
			} else {
				if (!isUnmountClean) {
					clean();
				} else {
					temp.push(clean);
				}
			}
		}
		if (isUnmounted) {
			props = void 0;
			effects.length = 0;
			cleanEffects.length = 0;
			hookQueue.length = 0;
		} else {
			cleanEffects.push(...temp);
		}
	};

	const hookMap = {
		useState,
		useEffect,
		useSyncExternalStore
	};

	let props = void 0;
	let newProps = (yield) || {};
	let result = null;

	while (true) {
		self.flushCleanEffects();

		StateIndex = 0;

		result = func.call(self, newProps, props, hookMap);

		props = newProps;

		newProps = yield result;

		hookMap.instance = result;
	}
}

const componentCreator = firstNextWithProps(withStateFun);

export function generator(pushRenderFiber, element) {
	const result = componentCreator(
		typeof element.type === 'function'
			? element.type
			: buildInMap[element.type],
		pushRenderFiber
	);
	return result;
}
