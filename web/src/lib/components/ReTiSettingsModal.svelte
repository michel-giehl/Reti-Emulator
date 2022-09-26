<script lang="ts">
	export let id: string;

	$: data = [];
	function onUARTChange(e) {}
</script>

<input type="checkbox" {id} class="modal-toggle" />
<div class="modal">
	<div class="modal-box">
		<form on:submit|preventDefault={onUARTChange}>
			<!-- EPROM Part -->
			<h3>EPROM</h3>
			<div class="form-control w-32">
				<div class="tooltip tooltip-right" data-tip="UART sends data to the ReTi">
					<label class="label cursor-pointer">
						<span class="label-text">📤 Send</span>
						<input type="radio" name="mode" value="send" class="radio" checked />
					</label>
				</div>
			</div>

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
						value={data}
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
