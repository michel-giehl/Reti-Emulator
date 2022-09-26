<script lang="ts">
	import { CompilationError, compileSingle } from '$lib/reti_compiler';
	import { uartData } from '$lib/global_vars';
	export let id: string;

	$: data = [];
	function onUARTChange(e: any) {
		const formData = new FormData(e.target);
		const mode = formData.get('mode')!.toString();
		const data = formData.get('data')!.toString();
		const dataFormat = formData.get('data-format');

		let bytes: Array<number>;

		switch (dataFormat) {
			case 'Bytes':
				bytes = data.split(',').map(Number);
				break;
			case 'String':
				// convert string to ascii byte array
				bytes = data.split('').map((char) => char.charCodeAt(0));
				break;
			case 'ReTi':
				try {
					let commands = data.split(',').map((str) => compileSingle(str));
					bytes = [];
					for (let command of commands) {
						// split 32 bit command into 4 bytes
						bytes.push((command & 0xff000000) >> 24);
						bytes.push((command & 0x00ff0000) >> 16);
						bytes.push((command & 0x0000ff00) >> 8);
						bytes.push(command & 0x000000ff);
					}
				} catch (e) {
					if (e instanceof CompilationError) {
						statusText(
							true,
							'error',
							'An error occurred during code compilation. Make sure to provided a comma seperated list of valid reti commands!'
						);
					}
				}
				break;
		}

		// Set format to bytes since the data has been converted into a byte array.
		// @ts-ignore
		document.getElementsByName('data-format')[0].value = 'Bytes';

		uartData.update((val) => {
			val.data = bytes;
			val.mode = mode;
			return val;
		});
	}
</script>

<input type="checkbox" {id} class="modal-toggle" />
<div class="modal">
	<div class="modal-box">
		<form on:submit|preventDefault={onUARTChange}>
			<!-- UART Part -->
			<h3>UART Mode</h3>
			<div class="form-control w-32">
				<div class="tooltip tooltip-right" data-tip="UART sends data to the ReTi">
					<label class="label cursor-pointer">
						<span class="label-text">📤 Send</span>
						<input type="radio" name="mode" value="send" class="radio" checked />
					</label>
				</div>
			</div>
			<div class="form-control w-32">
				<div class="tooltip tooltip-right" data-tip="UART receives data from the ReTi">
					<label class="label cursor-pointer">
						<span class="label-text">📥 Receive</span>
						<input type="radio" name="mode" value="receive" class="radio" />
					</label>
				</div>
			</div>
			<div class="form-control">
				<label class="input-group">
					<select name="data-format" class="select select-bordered bg-base-300">
						<option selected>Bytes</option>
						<option>String</option>
						<option>ReTi</option>
					</select>
					<input
						name="data"
						type="text"
						placeholder="0,1,2,3,4"
						class="input input-bordered"
						value={$uartData.data}
					/>
				</label>
			</div>
			<div class="modal-action">
				<button
					for={id}
					class="btn btn-info"
					type="submit"
					on:click={() => {
						// close modal
						// @ts-ignore
						document.getElementById(id).checked = false;
					}}>Apply</button
				>
			</div>
		</form>
	</div>
</div>
