const resolvedPromise = Promise.resolve();
const queueMicrotask =
	window.queueMicrotask ||
	((callback) => {
		if (typeof callback !== 'function') {
			throw new TypeError('The argument to queueMicrotask must be a function.');
		}

		resolvedPromise.then(callback);
	});

const uniqueSet = new Set();
export const queueMicrotaskOnce = (func) => {
	if (!uniqueSet.has(func)) {
		uniqueSet.add(func);
		queueMicrotask(() => {
			func();
			uniqueSet.delete(func);
		});
	}
};

let isMessageLoopRunning = false;
const scheduledCallbackQueue = [];
const frameYieldMs = 8;

const performWork = () => {
	console.log('performWork len:' + scheduledCallbackQueue.length);
	const startTime = performance.now();

	if (scheduledCallbackQueue.length) {
		try {
			let timeElapsed = 0;

			while (timeElapsed < frameYieldMs && scheduledCallbackQueue.length) {
				const work = scheduledCallbackQueue.shift();
				work();
				timeElapsed = performance.now() - startTime;
			}
		} finally {
			if (scheduledCallbackQueue.length) {
				schedulePerform();
			} else {
				isMessageLoopRunning = false;
			}
		}
	} else {
		isMessageLoopRunning = false;
	}
};

const channel = new MessageChannel();
channel.port1.onmessage = performWork;
const schedulePerform = () => channel.port2.postMessage(null);

export const queueMacrotask = (callback) => {
	scheduledCallbackQueue.push(callback);
	if (!isMessageLoopRunning) {
		isMessageLoopRunning = true;
		schedulePerform();
	}
};
