<script lang="ts">
	import Pause from 'svelte-material-icons/Pause.svelte';
	import Play from 'svelte-material-icons/Play.svelte';
	import Rewind from 'svelte-material-icons/Rewind.svelte';
	import FastForward from 'svelte-material-icons/FastForward.svelte';
	import { clockSpeed, showAnimation, paused, numberStyle } from '$lib/global_vars';
	import { nextReTiState, previousReTiState } from '$lib/controls';

	const numberStyleMapping: { [key: string]: number } = {
		binary: 2,
		decimal: 10,
		hexadecimal: 16
	};

	const clockspeedOptions = [0.2, 0.5, 1, 2, 5, 10, 100];

	const onSubmit = (e: any) => {
		const val = e?.target?.attributes?.value?.value ?? 'decimal';
		$numberStyle = numberStyleMapping[val.toLowerCase()];
		console.log($numberStyle);
	};
</script>

<div class="navbar bg-base-100">
	<div class="flex-2">
		<button
			class="btn btn-square btn-ghost group"
			on:click={() => {
				paused.update((val) => !val);
			}}
		>
			<svelte:component
				this={$paused ? Play : Pause}
				size={32}
				class="inline-block w-5 h-5 stroke-current"
			/>
			<span class="group-hover:hidden block">{$paused ? 'Play' : 'Pause'}</span>
		</button>
	</div>
	<div class="flex-2 ml-2">
		<button
			class="btn btn-square btn-ghost group"
			on:click={() => {
				previousReTiState();
			}}
		>
			<svelte:component this={Rewind} size={32} class="inline-block w-5 h-5 stroke-current" />
			<span class="group-hover:hidden block">Prev</span>
		</button>
	</div>
	<div class="flex-1 ml-2">
		<button
			class="btn btn-square btn-ghost group"
			on:click={() => {
				nextReTiState();
			}}
		>
			<svelte:component this={FastForward} size={32} class="inline-block w-5 h-5 stroke-current" />
			<span class="group-hover:hidden block">Next</span>
		</button>
	</div>

	<div class="flex-none ml-2 font-semibold uppercase text-sm">
		<label for="toggle-animation" class="swap hidden lg:block">Animation</label>
		<input
			id="toggle-animation"
			type="checkbox"
			class="toggle ml-2"
			bind:checked={$showAnimation}
		/>
	</div>
	<div class="flex-none dropdown dropdown-hover ml-2">
		<label tabindex="0" class="btn btn-outline m-1 flex xl:hidden" for="clockspeed-dropdown"
			>{$clockSpeed} hz</label
		>
		<label tabindex="0" class="btn btn-outline m-1 w-36 hidden xl:flex" for="clockspeed-dropdown"
			>Speed: {$clockSpeed} hz</label
		>
		<ul
			tabindex="0"
			id="clockspeed-dropdown"
			class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-28"
		>
			<!-- svelte-ignore a11y-missing-attribute -->
			<li><a>1</a></li>
			{#each clockspeedOptions as opt}
				<!-- svelte-ignore a11y-missing-attribute -->
				<li><a on:click={() => ($clockSpeed = opt)}>{opt} Hz</a></li>
			{/each}
			<input
				class="dropdown-content w-24 h-12 input input-bordered"
				type="number"
				min="0"
				max="20"
				step="0.1"
				bind:value={$clockSpeed}
			/>
		</ul>
	</div>
	<div class="flex-none dropdown dropdown-hover ml-2">
		<label tabindex="0" class="btn btn-outline m-1 flex xl:hidden" for="number-style-dropdown"
			>#</label
		>
		<label tabindex="0" class="btn btn-outline m-1 hidden xl:flex" for="number-style-dropdown"
			>Number Style</label
		>
		<ul
			tabindex="0"
			id="number-style-dropdown"
			class="dropdown-content menu p-2 shadow bg-base-100 rounded-box right-0 xl:left-0"
		>
			{#each Object.keys(numberStyleMapping) as style}
				<li>
					<!-- svelte-ignore a11y-missing-attribute -->
					<a value={style} on:click={onSubmit}>{style.charAt(0).toUpperCase() + style.slice(1)}</a>
				</li>
			{/each}
		</ul>
	</div>
</div>
