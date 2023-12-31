import { shallowEqual } from './util';
import { buildInMap } from './buildIn';

export const NoneLane = 0b000001;
export const MountedLane = 0b000010;
export const UpdatedLane = 0b000100;
export const UnMountedLane = 0b001000;

export const GeneratorPool = new Map();

const firstNextWithProps = (generatorFunction) => {
	return (...args) => {
		const generatorObject = generatorFunction(...args);

		generatorObject.next();

		const result = {
			next: (...args) => {
				return generatorObject.next(...args);
			},
			throw: (...args) => {
				return generatorObject.throw(...args);
			},
			return: (...args) => {
				return generatorObject.return(...args);
			},
			StatusLane: NoneLane
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

function* withStateFun(func, pushRenderElement) {
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

				pushRenderElement(self);
			}
		];
	};

	const effects = [];
	const cleanEffects = [];
	const useEffect = (effect, deps) => {
		const innerIndex = StateIndex++;
		const oldEffect = hookQueue[innerIndex];
		hookQueue[innerIndex] = [effect, deps];

		if (deps == void 0) {
			return effects.push(effect);
		}

		if (self.StatusLane === MountedLane) {
			effects.push(effect);
			effect.mountDep = !deps.length;
		} else if (deps.length && !shallowEqual(deps, oldEffect[1])) {
			effects.push(effect);
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
		self.StatusLane = UpdatedLane;
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
		result = func.call(hookMap, newProps, props, hookMap);

		props = newProps;

		newProps = yield result;

		hookMap.instance = result;
	}
}

export const componentCreator = firstNextWithProps(withStateFun);

export function generator(pushRenderElement, element) {
	if (!GeneratorPool[element._key]) {
		GeneratorPool[element._key] = componentCreator(
			typeof element.type === 'string'
				? buildInMap[element.type]
				: element.type,
			pushRenderElement
		);
		GeneratorPool[element._key].element = element;
	}
	if (GeneratorPool[element._key].StatusLane & (NoneLane | UnMountedLane)) {
		GeneratorPool[element._key].StatusLane = MountedLane;
	}
	return GeneratorPool[element._key];
}
