const resolvedPromise = Promise.resolve();
export const queueMicrotask =
	window.queueMicrotask ||
	((callback) => {
		if (typeof callback !== 'function') {
			throw new TypeError('The argument to queueMicrotask must be a function.');
		}

		resolvedPromise.then(callback).catch((error) =>
			setTimeout(() => {
				throw error;
			}, 0)
		);
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
const performWork = () => {
	if (scheduledCallbackQueue.length) {
		try {
			const work = scheduledCallbackQueue.shift();
			work();
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
