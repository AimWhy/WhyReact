import { createRoot, jsx, Fragment } from 'WhyReact';

function Hello(props, oldProps, { useState, useEffect }) {
	const [state, setState] = useState('aimwhy');
	const [state2, setState2] = useState('tt');

	useEffect(() => {
		console.log('%c Hello Mounted', 'color:#0f0;');
		return () => {
			console.log('%c Hello UnMounted', 'color:#0f0;');
		};
	}, []);

	useEffect(() => {
		console.log('%c Hello Update', 'color:#990;');
	});

	useEffect(() => {
		console.log('%c Hello Dep Update', 'color:#990;');
	}, [window.a]);

	return jsx('div', {
		children: [
			props.children(),
			state,
			jsx('div', { children: state2 }),
			jsx('input', {
				onInput: (e) => {
					props.parentChange((v) => !v);
					setState(e.target.value);
					setState2(() => 'tt' + e.target.value.slice(-3));
				},
				value: state,
				type: 'text'
			})
		]
	});
}

function World(props, oldProps, { useState, useEffect }) {
	const [state, setState] = useState('点击我');

	useEffect(() => {
		console.log('%c World Mounted', 'color:#0f0;');
		return () => {
			console.log('%c World UnMounted', 'color:#0f0;');
		};
	}, []);
	useEffect(() => {
		console.log('%c World Update', 'color:#990;');
	});

	return jsx('div', {
		onClickOnce: (e) => {
			setState((v) => v + 2);
			e.stopPropagation();
		},
		children: [state]
	});
}

function App(props, oldProps, { useState, useEffect }) {
	const [state, setState] = useState(true);
	const [state2, setState2] = useState(true);

	useEffect(() => {
		console.log('%c App Mounted', 'color:#0f0;');
		return () => {
			console.log('%c App UnMounted', 'color:#0f0;');
		};
	}, []);
	useEffect(() => {
		console.log('%c App Update', 'color:#990;');
	});

	return jsx('div', {
		onClick: () => {
			setState((v) => !v);
		},
		children: [
			!state
				? jsx(
						Fragment,
						{
							children: ['Portal-aa', 'Portal-bb'],
							target: document.body
						},
						'Portal'
				  )
				: 'Portal Origin',

			jsx(
				Hello,
				{
					parentChange: setState2,
					id: 'hello',
					children: () =>
						jsx('i', {
							children: ['i    ', state2]
						})
				},
				'hello'
			),

			state ? jsx(World) : '销毁后的文案',

			['github!', null, ' aimwhy'],
			<div>ddd</div>
		]
	});
}

createRoot(document.querySelector('#main')).render(jsx(App));
