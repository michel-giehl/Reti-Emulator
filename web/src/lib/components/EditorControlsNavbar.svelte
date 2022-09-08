<script lang="ts">
	import Play from 'svelte-material-icons/Play.svelte';
	import ContentSaveOutline from 'svelte-material-icons/ContentSaveOutline.svelte';
	import TrayArrowUp from 'svelte-material-icons/TrayArrowUp.svelte';
	import FormatColorText from 'svelte-material-icons/FormatColorText.svelte';
	import DesktopClassic from 'svelte-material-icons/DesktopClassic.svelte';

	import { draw } from '$lib/canvas';
	import { strokeColor, reti, editorMode, uartData } from '$lib/global_vars';
	import { loadExample, runReti, switchCodeWindow } from '$lib/controls';
	import { CompilationError, compileSingle } from '$lib/reti_compiler';
	import { statusText } from './Alert.svelte';

	// TODO: load all examples on mount
	$: examples = [];
	editorMode.subscribe(async (em) => {
		const result = await fetch('/example', { headers: { Language: em } });
		examples = await result.json();
	});

	function onSubmit(e: any) {
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
				bytes = data.split('').map((char) => char.charCodeAt(0));
				// @ts-ignore
				document.getElementsByName('data-format')[0].value = 'Bytes';
				break;
			case 'ReTi':
				try {
					let commands = data.split(',').map((str) => compileSingle(str));
					bytes = [];
					for (let command of commands) {
						bytes.push((command & 0xff000000) >> 24);
						bytes.push((command & 0x00ff0000) >> 16);
						bytes.push((command & 0x0000ff00) >> 8);
						bytes.push(command & 0x000000ff);
					}
					// @ts-ignore
					document.getElementsByName('data-format')[0].value = 'Bytes';
				} catch (e) {
					if (e instanceof CompilationError) {
						statusText(
							true,
							'error',
							'An error occurred during reti compilation. Make sure to provided a comma seperated list of valid reti commands!'
						);
					}
				}
				break;
		}
		uartData.update((val) => {
			val.data = bytes;
			val.mode = mode;
			return val;
		});
	}

	let activeTheme: string = 'theme';
	let mode: string = 'reti';
	$: data = $uartData.data;
</script>

<div class="navbar bg-base-100">
	<div class="flex-2">
		<button class="btn btn-square btn-ghost group" on:click={runReti}>
			<svelte:component this={Play} size={32} class="inline-block stroke-current" />
			<span class="group-hover:hidden block">Run</span>
		</button>
	</div>

	<!--
	<div class="flex-2 ml-2 group">
		<div class="tooltip" data-tip="💾 Save">
			<button class="btn btn-square btn-ghost" on:click={save}>
				<svelte:component
					this={ContentSaveOutline}
					size={32}
					class="inline-block w-5 h-5 stroke-current"
				/>
				<span>Save</span>
			</button>
		</div>
	</div>
	<div class="flex-2 ml-2">
		<div class="tooltip" data-tip="📤 Share">
			<button class="btn btn-square btn-ghost">
				<svelte:component
					this={TrayArrowUp}
					size={32}
					class="inline-block w-5 h-5 stroke-current"
				/>
				<span>Share</span>
			</button>
		</div>
	</div>
	<div class="flex-1 ml-2">
		<div class="tooltip" data-tip="🗛 Font">
			<button class="btn btn-square btn-ghost">
				<svelte:component
					this={FormatColorText}
					size={32}
					class="inline-block w-5 h-5 stroke-current"
				/>
				<span>Font</span>
			</button>
		</div>
	</div>
	-->
	<div class="flex-1 ml-2">
		<label for="uart-modal" class="btn btn-square btn-ghost modal-button group">
			<svelte:component
				this={DesktopClassic}
				size={32}
				class="inline-block w-5 h-5 stroke-current"
			/>
			<span class="group-hover:hidden block">UART</span>
		</label>
	</div>

	<!-- UART MODAL -->
	<input type="checkbox" id="uart-modal" class="modal-toggle" />
	<div class="modal">
		<div class="modal-box">
			<form on:submit|preventDefault={onSubmit}>
				<h3>Mode</h3>
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
						for="uart-modal"
						class="btn btn-info"
						type="submit"
						on:click={() => {
							// @ts-ignore
							document.getElementById('uart-modal').checked = false;
						}}>Apply</button
					>
				</div>
			</form>
		</div>
	</div>

	<div class="flex-none ml-2 hidden xl:block">
		<select
			data-choose-theme
			class="select select-bordered w-full max-w-xs"
			bind:value={activeTheme}
		>
			<option selected disabled value="theme">Theme</option>
			<option value="light">light</option>
			<option value="halloween">dark</option>
			<option value="retro">solarized</option>
		</select>
	</div>

	<!--
	<div class="flex-none ml-2">
		<div class="tooltip" data-tip="💻 Modus">
			<select class="select select-bordered w-full max-w-xs">
				<option>Einfache ReTi</option>
				<option>Erweirterte ReTi</option>
			</select>
		</div>
	</div>
	-->

	<div class="flex-none ml-2 hidden lg:block ">
		<select
			class="select select-bordered w-full max-w-xs"
			on:change={async (e) => {
				// @ts-ignore
				await loadExample(e.target.value + '.' + $editorMode);
			}}
		>
			<option disabled selected>Examples</option>
			{#each examples as example}
				<option value={example}>{example}</option>
			{/each}
		</select>
	</div>

	<div class="flex-none ml-2 hidden md:block">
		<select
			class="select select-bordered w-full max-w-xs"
			bind:value={mode}
			on:change={() => {
				switchCodeWindow(mode);
				$editorMode = mode;
			}}
		>
			<option selected value="reti">ReTi Assembler</option>
			<option value="picoc">Pico-C</option>
		</select>
	</div>
</div>
