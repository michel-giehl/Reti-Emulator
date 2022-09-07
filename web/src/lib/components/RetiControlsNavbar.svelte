<script lang="ts">
	import Pause from 'svelte-material-icons/Pause.svelte';
	import Play from 'svelte-material-icons/Play.svelte';
	import Rewind from 'svelte-material-icons/Rewind.svelte';
	import FastForward from 'svelte-material-icons/FastForward.svelte';
	import { clockSpeed, showAnimation, paused, numberStyle } from '$lib/global_vars';
	import { nextReTiState, previousReTiState } from '$lib/controls';

	export let clockspeedOptions: Array<number>;
	export let numberStyles: Array<string>;

	let speed: number = 1;

	const onSubmit = (e: any) => {
		const val = e?.target?.attributes?.value?.value ?? 'decimal';
		const mapping: { [key: string]: number } = {
			binary: 2,
			decimal: 10,
			hexadecimal: 16
		};
		$numberStyle = mapping[val.toLowerCase()];
		console.log($numberStyle);
	};
</script>

<div class="navbar bg-base-100">
	<div class="flex-2">
		<div class="tooltip" data-tip="⏯️ Play/Pause">
			<button
				class="btn btn-square btn-ghost"
				on:click={() => {
					paused.update((val) => !val);
				}}
			>
				<svelte:component
					this={$paused ? Play : Pause}
					size={32}
					class="inline-block w-5 h-5 stroke-current"
				/>
			</button>
		</div>
	</div>
	<div class="flex-2 ml-2">
		<div class="tooltip" data-tip="⏪ Step backwards">
			<button
				class="btn btn-square btn-ghost"
				on:click={() => {
					previousReTiState();
				}}
			>
				<svelte:component this={Rewind} size={32} class="inline-block w-5 h-5 stroke-current" />
			</button>
		</div>
	</div>
	<div class="flex-1 ml-2">
		<div class="tooltip" data-tip="⏩ Step forwards">
			<button
				class="btn btn-square btn-ghost"
				on:click={() => {
					nextReTiState();
				}}
			>
				<svelte:component
					this={FastForward}
					size={32}
					class="inline-block w-5 h-5 stroke-current"
				/>
			</button>
		</div>
	</div>

	<div class="flex-none ml-2 font-semibold uppercase text-sm">
		<label for="toggle-animation" class="swap">Animation</label>
		<input
			id="toggle-animation"
			type="checkbox"
			class="toggle ml-2"
			bind:checked={$showAnimation}
		/>
	</div>
	<div class="flex-none dropdown ml-2">
		<label tabindex="0" class="btn btn-outline m-1 w-36" for="clockspeed-dropdown"
			>Speed: {$clockSpeed} hz</label
		>
		<ul
			tabindex="0"
			id="clockspeed-dropdown"
			class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
		>
			<!-- svelte-ignore a11y-missing-attribute -->
			<li><a>1</a></li>
			{#each clockspeedOptions as opt}
				<!-- svelte-ignore a11y-missing-attribute -->
				<li><a on:click={() => ($clockSpeed = opt)}>{opt} Hz</a></li>
			{/each}
			<input
				class="dropdown-content w-48 h-12 input input-bordered"
				type="number"
				min="0"
				max="20"
				step="0.1"
				bind:value={$clockSpeed}
			/>
		</ul>
	</div>
	<div class="flex-none dropdown ml-2">
		<label tabindex="0" class="btn btn-outline m-1" for="number-style-dropdown">Number Style</label>
		<ul
			tabindex="0"
			id="number-style-dropdown"
			class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
		>
			{#each numberStyles as style}
				<!-- svelte-ignore a11y-missing-attribute -->
				<li>
					<a value={style} on:click={onSubmit}>{style}</a>
				</li>
			{/each}
		</ul>
	</div>
</div>
