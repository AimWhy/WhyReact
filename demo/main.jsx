import { createRoot, Fragment as Fragment1, useState, useFiber } from './abc';

function Hello(props) {
	const [state, setState] = useState('aimwhy');
	const [state2, setState2] = useState('tt');

	// useFiber().onMounted.add(() => {
	// 	alert(1);
	// });

	// useEffect(() => {
	// 	console.log('%c Hello Mounted', 'color:#0f0;');
	// 	return () => {
	// 		console.log('%c Hello UnMounted', 'color:#0f0;');
	// 	};
	// }, []);

	// useEffect(() => {
	// 	console.log('%c Hello Update', 'color:#990;');
	// });
	// useEffect(
	// 	(cur, pre) => {
	// 		console.log(cur, pre, '%c Hello Dep Update', 'color:#990;');
	// 	},
	// 	[window.a]
	// );

	return (
		<>
			{props.children()}
			<div>{state}</div>
			<div>{state2}</div>
			<input
				ref={(dom) => {
					window.a = dom;
				}}
				type="text"
				value={state}
				onInput={(e) => {
					props.parentChange((v) => !v);
					setState(e.target.value);
					setState2(() => 'tt' + e.target.value.slice(-3));
				}}
			/>
		</>
	);
}

function World(props) {
	const [state, setState] = useState('点击我');
	useFiber().onMounted.add(() => {
		console.log('%c World onMounted', 'color:#0f0;');
		return () => {
			console.log('%c World onUnMounted', 'color:#0f0;');
		};
	});

	// useEffect(() => {
	// 	console.log('%c World Mounted', 'color:#0f0;');
	// 	return () => {
	// 		console.log('%c World UnMounted', 'color:#0f0;');
	// 	};
	// }, []);

	// useEffect(() => {
	// 	console.log('%c World Update', 'color:#990;');
	// });

	return <div>{state}</div>;
}

const memo = () => <i>i {5555}</i>;

function App(props) {
	const [state, setState] = useState(true);
	const [state2, setState2] = useState(true);

	// useEffect(() => {
	// 	console.log('%c App Mounted', 'color:#0f0;');
	// 	return () => {
	// 		console.log('%c App UnMounted', 'color:#0f0;');
	// 	};
	// }, []);

	// useEffect(() => {
	// 	console.log('%c App Update', 'color:#990;');
	// });

	return (
		<Fragment1 key="99">
			<button
				onClick={() => {
					setState((v) => !v);
				}}
			>
				点击事件
			</button>

			<Fragment1 key="lkjsdflkj" __target={state ? document.body : void 0}>
				<div>倪玲玲是个</div>
			</Fragment1>

			<Fragment1 key="88">
				<div>Fragment</div>
			</Fragment1>

			<Fragment1 key="799" __target={document.body}>
				<div>Portal-body A</div>
			</Fragment1>

			{!state ? (
				<Fragment1 key="77" __target={document.body}>
					<div>Portal-body</div>
				</Fragment1>
			) : (
				'Portal inner'
			)}

			<Hello parentChange={setState2} key="hello">
				{memo}
			</Hello>

			{state ? (
				<World
					ref={(dom) => {
						window.b = dom;
					}}
				/>
			) : (
				<div>销毁后的文案</div>
			)}

			{['github!', null, ' aimwhy']}
		</Fragment1>
	);
}

createRoot(document.querySelector('#app')).render(<App />);
