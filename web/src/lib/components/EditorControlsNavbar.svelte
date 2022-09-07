<script lang="ts">
	import Play from 'svelte-material-icons/Play.svelte';
	import ContentSaveOutline from 'svelte-material-icons/ContentSaveOutline.svelte';
	import TrayArrowUp from 'svelte-material-icons/TrayArrowUp.svelte';
	import FormatColorText from 'svelte-material-icons/FormatColorText.svelte';
	import DesktopClassic from 'svelte-material-icons/DesktopClassic.svelte';

	import { createEventDispatcher } from 'svelte';

	import { draw } from '$lib/canvas';
	import { strokeColor, reti, editorMode, uartData } from '$lib/global_vars';
	import { loadExample, switchCodeWindow } from '$lib/controls';

	editorMode.subscribe(async (em) => {
		const result = await fetch('/example', { headers: { Language: em } });
		examples = await result.json();
	});

	const dispatch = createEventDispatcher();

	function onSubmit(e: any) {
		const formData = new FormData(e.target);
		const mode = formData.get('mode')!.toString();
		const data = formData.get('data')!.toString();
		const bytes = data.split(',').map(Number);
		uartData.update((val) => {
			val.data = bytes;
			val.mode = mode;
			return val;
		});
	}

	function run() {
		dispatch('run');
	}

	function save() {
		dispatch('save', {
			text: 'KEKO'
		});
	}

	$: examples = [];

	export const size: string = '32';

	let activeTheme: string = 'light';
	let mode: string = 'reti';
	$: data = $uartData.data;
</script>

<div class="navbar bg-base-100">
	<div class="flex-2 group">
		<div class="tooltip" data-tip="🚀 Run">
			<button class="btn btn-square btn-ghost" on:click={run}>
				<svelte:component this={Play} size={32} class="inline-block w-5 h-5 stroke-current" />
				<span>Run</span>
			</button>
		</div>
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
		<div class="tooltip" data-tip="🖥️ UART">
			<label for="uart-modal" class="btn btn-square btn-ghost modal-button">
				<svelte:component
					this={DesktopClassic}
					size={32}
					class="inline-block w-5 h-5 stroke-current"
				/>
				<span>UART</span>
			</label>
		</div>
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
						<select class="select select-bordered bg-base-300">
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
							document.getElementById('uart-modal').checked = false;
						}}>Apply</button
					>
				</div>
			</form>
		</div>
	</div>

	<div class="flex-none ml-2">
		<div class="tooltip" data-tip="🎨 Theme">
			<select
				data-choose-theme
				class="select select-bordered w-full max-w-xs"
				bind:value={activeTheme}
				on:change={() => {
					const darkThemes = [
						'dark',
						'synthwave',
						'halloween',
						'forest',
						'black',
						'luxury',
						'dracula',
						'business',
						'night',
						'coffee'
					];
					if (darkThemes.includes(activeTheme)) {
						$strokeColor = 'white';
					} else {
						$strokeColor = 'black';
					}
					draw($reti);
				}}
			>
				<option value="light">light</option>
				<option value="halloween">dark</option>
				<option value="retro">solarized</option>
				<option value="valentine">pink</option>
			</select>
		</div>
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

	<div class="flex-none ml-2">
		<div class="tooltip" data-tip="💻 Modus">
			<select
				class="select select-bordered w-full max-w-xs"
				on:change={async (e) => {
					await loadExample(e.target.value + '.' + $editorMode);
				}}
			>
				<option disabled selected>Examples</option>
				{#each examples as example}
					<option value={example}>{example}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="flex-none ml-2">
		<div class="tooltip" data-tip="🤖 Sprache">
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
</div>
