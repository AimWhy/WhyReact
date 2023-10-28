import { createRoot, useState } from './abc';

const random = (max) => Math.round(Math.random() * 1000) % max;

const A = [
	'pretty',
	'large',
	'big',
	'small',
	'tall',
	'short',
	'long',
	'handsome',
	'plain',
	'quaint',
	'clean',
	'elegant',
	'easy',
	'angry',
	'crazy',
	'helpful',
	'mushy',
	'odd',
	'unsightly',
	'adorable',
	'important',
	'inexpensive',
	'cheap',
	'expensive',
	'fancy'
];

const C = [
	'red',
	'yellow',
	'blue',
	'green',
	'pink',
	'brown',
	'purple',
	'brown',
	'white',
	'black',
	'orange'
];

const N = [
	'table',
	'chair',
	'house',
	'bbq',
	'desk',
	'car',
	'pony',
	'cookie',
	'sandwich',
	'burger',
	'pizza',
	'mouse',
	'keyboard'
];

let nextId = 1;

const buildData = (count) => {
	const data = new Array(count);

	for (let i = 0; i < count; i++) {
		data[i] = {
			id: nextId++,
			label: `${A[random(A.length)]} ${C[random(C.length)]} ${
				N[random(N.length)]
			}`
		};
	}

	return data;
};

const initialState = { data: buildData(10) };

function Row(props) {
	let onSelect = () => {
		const { item, dispatch } = props;
		dispatch({ type: 'SELECT', id: item.id });
	};

	let onRemove = () => {
		const { item, dispatch } = props;
		dispatch({ type: 'REMOVE', id: item.id });
	};
	const { item } = props;

	return (
		<tr>
			<td className="col-md-1">{item.id}</td>
			<td className="col-md-4">
				<a onClick={onSelect}>{item.label}</a>
				<div className="wanghongying">
					<span>
						<i>33333</i>
					</span>
				</div>
			</td>
			<td className="col-md-4">
				<a onClick={onSelect}>{item.label}</a>
				<div className="wanghongying">
					<span>
						<i>33333</i>
					</span>
				</div>
			</td>
			<td className="col-md-4">
				<a onClick={onSelect}>{item.label}</a>
				<div className="wanghongying">
					<span>
						<i>33333</i>
					</span>
				</div>
			</td>
			<td className="col-md-1">
				<a onClick={onRemove}>删除</a>
			</td>
			<td className="col-md-6" />
		</tr>
	);
}

function Button(props) {
	const { id, cb, title } = props;

	return (
		<div className="col-sm-6 smallpad">
			<button
				type="button"
				className="btn btn-primary btn-block"
				id={id}
				onClick={cb}
			>
				{title}
			</button>
		</div>
	);
}

function Jumbotron(props) {
	const { dispatch } = props;

	return (
		<div className="jumbotron" key="jum">
			<div className="row">
				<div className="col-md-6">
					<h1>React keyed</h1>
				</div>
				<div className="col-md-6">
					<div className="row">
						<Button
							id="run"
							title="Create 2,000 rows"
							cb={() => dispatch({ type: 'RUN' })}
						/>
						<Button
							id="runlots"
							title="Create 10,000 rows"
							cb={() => dispatch({ type: 'RUN_LOTS' })}
						/>
						<Button
							id="add"
							title="Append 1,000 rows"
							cb={() => dispatch({ type: 'ADD' })}
						/>
						<Button
							id="update"
							title="Update every 10th row"
							cb={() => dispatch({ type: 'UPDATE' })}
						/>
						<Button
							id="clear"
							title="Clear"
							cb={() => dispatch({ type: 'CLEAR' })}
						/>
						<Button
							id="swaprows"
							title="Swap Rows"
							cb={() => dispatch({ type: 'SWAP_ROWS' })}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

let outerDispatch = null;
function Main(props) {
	let [state, setState] = useState(initialState);
	let dispatch =
		outerDispatch ||
		function (setState, action) {
			switch (action.type) {
				case 'RUN':
					return setState({ data: buildData(2000) });
				case 'RUN_LOTS':
					return setState({ data: buildData(10000) });
				case 'ADD':
					return setState(({ data }) => ({
						data: data.concat(buildData(1000))
					}));
				case 'UPDATE': {
					return setState(({ data }) => {
						const newData = data.slice(0);

						for (let i = 0; i < newData.length; i += 10) {
							const r = newData[i];

							newData[i] = { id: r.id, label: r.label + ' !!!' };
						}

						return { data: newData };
					});
				}
				case 'CLEAR':
					return setState({ data: [] });
				case 'SWAP_ROWS': {
					return setState(({ data }) => {
						if (data.length > 8) {
							return {
								data: [
									data[0],
									data[1],
									data[8],
									...data.slice(3, 8),
									data[2],
									data[9]
								]
							};
						}
						return { data };
					});
				}
				case 'REMOVE': {
					return setState(({ data }) => {
						const idx = data.findIndex((d) => d.id === action.id);
						return {
							data: [...data.slice(0, idx), ...data.slice(idx + 1)]
						};
					});
				}
				case 'SELECT':
					return;
			}
		}.bind(null, setState);
	outerDispatch = dispatch;
	const { data } = state;

	return (
		<div className="container">
			<Jumbotron dispatch={dispatch} />
			<table className="table table-hover table-striped test-data">
				<tbody>
					{data.map((item) => (
						<Row key={item.id} item={item} dispatch={dispatch} />
					))}
				</tbody>
			</table>
			<span
				className="preloadicon glyphicon glyphicon-remove"
				aria-hidden="true"
			/>
		</div>
	);
}

createRoot(document.querySelector('#app')).render(<Main />);
