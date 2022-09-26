<script lang="ts">
	import Play from 'svelte-material-icons/Play.svelte';
	import DesktopClassic from 'svelte-material-icons/DesktopClassic.svelte';

	import { editorMode, uartData } from '$lib/global_vars';
	import { loadExample, runReti, switchCodeWindow } from '$lib/controls';
	import { CompilationError, compileSingle } from '$lib/reti_compiler';
	import { statusText } from './Alert.svelte';
import ReTiSettingsModal from './ReTiSettingsModal.svelte';

	// Load examples when user switches languages
	// TODO: load all examples on mount
	$: examples = [];
	editorMode.subscribe(async (em) => {
		const result = await fetch('/example', { headers: { Language: em } });
		examples = await result.json();
	});

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

	let activeTheme: string = 'theme';
	let mode: string = 'reti';
	// reactive uart data property.
	$: data = $uartData.data;
</script>

<div class="navbar bg-base-100">
	<div class="flex-2">
		<button class="btn btn-square btn-ghost group" on:click={runReti}>
			<svelte:component this={Play} size={32} class="inline-block stroke-current" />
			<span class="group-hover:hidden block">Run</span>
		</button>
	</div>

	<!--<div class="flex-2 ml-2 group">
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
	</div> -->

	<div class="flex-1 ml-2">
		<label for="reti-modal" class="btn btn-square btn-ghost modal-button group">
			<svelte:component
				this={DesktopClassic}
				size={32}
				class="inline-block w-5 h-5 stroke-current"
			/>
			<span class="group-hover:hidden block">UART</span>
		</label>
	</div>

	<!-- UART MODAL -->
	<ReTiSettingsModal id="reti-modal"/>

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
