import { createRoot } from '../src/index';

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

const initialState = { data: buildData(10), selected: 0 };

function Row(props) {
	let onSelect = () => {
		const { item, dispatch } = props;
		dispatch({ type: 'SELECT', id: item.id });
	};

	let onRemove = () => {
		const { item, dispatch } = props;
		dispatch({ type: 'REMOVE', id: item.id });
	};
	const { selected, item } = props;

	return (
		<tr className={selected ? 'danger' : ''}>
			<td className="col-md-1">{item.id}</td>
			<td className="col-md-4">
				<a onClick={onSelect}>{item.label}</a>
				<div>
					<span>
						<i>33333</i>
						<span>
							<span>
								<span>
									<span>
										<i>sdfsf</i>
										<span>
											<i>33333</i>
											<span>
												<span>
													<span>
														<span>
															<i>sdfsf</i>
														</span>
													</span>
												</span>
											</span>
										</span>
										<span>
											<i>33333</i>
											<span>
												<span>
													<span>
														<span>
															<i>sdfsf</i>
														</span>
													</span>
												</span>
											</span>
										</span>
									</span>
								</span>
							</span>
						</span>
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
		<div className="jumbotron">
			<div className="row">
				<div className="col-md-6">
					<h1>React keyed</h1>
				</div>
				<div className="col-md-6">
					<div className="row">
						<Button
							id="run"
							title="Create 1,000 rows"
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

function Main(props, oldProps, { useState }) {
	let [state, setState] = useState(initialState);

	let dispatch = (action) => {
		const { data } = state;

		switch (action.type) {
			case 'RUN':
				return setState({ data: buildData(1000), selected: 0 });
			case 'RUN_LOTS':
				return setState({ data: buildData(10000), selected: 0 });
			case 'ADD':
				return setState({ data: data.concat(buildData(1000)) });
			case 'UPDATE': {
				const newData = data.slice(0);

				for (let i = 0; i < newData.length; i += 10) {
					const r = newData[i];

					newData[i] = { id: r.id, label: r.label + ' !!!' };
				}

				return setState({ data: newData });
			}
			case 'CLEAR':
				return setState({ data: [], selected: 0 });
			case 'SWAP_ROWS': {
				if (data.length > 8) {
					return setState({
						data: [
							data[0],
							data[1],
							data[8],
							...data.slice(3, 8),
							data[2],
							data[9]
						]
					});
				}

				return;
			}
			case 'REMOVE': {
				const idx = data.findIndex((d) => d.id === action.id);

				return setState({
					data: [...data.slice(0, idx), ...data.slice(idx + 1)]
				});
			}
			case 'SELECT':
				return setState({ selected: action.id });
		}
	};

	const { data, selected } = state;

	return (
		<div className="container">
			<Jumbotron dispatch={dispatch} />
			<table className="table table-hover table-striped test-data">
				<tbody>
					{data.map((item) => (
						<Row
							key={item.id}
							item={item}
							selected={selected === item.id}
							dispatch={dispatch}
						/>
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
