import { createRoot, Fragment } from 'WhyReact';

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

	return (
		<div>
			{props.children()}
			{state}
			<div>{state2}</div>
			<input
				type="text"
				value={state}
				onInput={(e) => {
					props.parentChange((v) => !v);
					setState(e.target.value);
					setState2(() => 'tt' + e.target.value.slice(-3));
				}}
			/>
		</div>
	);
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

	return (
		<div
			onClickOnce={(e) => {
				setState((v) => v + 2);
				e.stopPropagation();
			}}
		>
			{state}
		</div>
	);
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

	return (
		<div
			onClick={() => {
				setState((v) => !v);
			}}
		>
			{!state ? (
				<Fragment target={document.body} key="Portal">
					Portal-aa
				</Fragment>
			) : (
				'Portal Origin'
			)}

			<Hello parentChange={setState2} key="hello">
				{() => <i>i {state2}</i>}
			</Hello>

			{state ? <World /> : '销毁后的文案'}

			{['github!', null, ' aimwhy']}
		</div>
	);
}

createRoot(document.querySelector('#main')).render(<App />);
