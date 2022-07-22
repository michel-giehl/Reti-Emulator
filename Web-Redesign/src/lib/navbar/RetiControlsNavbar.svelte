<script lang="ts">
	import Pause from 'svelte-material-icons/Pause.svelte';
	import Rewind from 'svelte-material-icons/Rewind.svelte';
	import FastForward from 'svelte-material-icons/FastForward.svelte';
	import ClockTimeTwoOutline from 'svelte-material-icons/ClockTimeTwoOutline.svelte';

	import Pound from 'svelte-material-icons/Pound.svelte';
	import MovieOpenPlayOutline from 'svelte-material-icons/MovieOpenPlayOutline.svelte';

	export let clockspeedOptions: Array<number>;
	export let numberStyles: Array<string>;
</script>

<div class="navbar bg-base-100">
	<div class="flex-2">
		<button class="btn btn-square btn-ghost">
			<svelte:component this={Pause} size={32} class="inline-block w-5 h-5 stroke-current" />
		</button>
	</div>
	<div class="flex-2 ml-2">
		<button class="btn btn-square btn-ghost">
			<svelte:component this={Rewind} size={32} class="inline-block w-5 h-5 stroke-current" />
		</button>
	</div>
	<div class="flex-1 ml-2">
		<button class="btn btn-square btn-ghost">
			<svelte:component this={FastForward} size={32} class="inline-block w-5 h-5 stroke-current" />
		</button>
	</div>

	<div class="flex-none ml-2 font-semibold uppercase text-sm">
		<label for="toggle-animation" class="swap">Animation</label>
		<input id="toggle-animation" type="checkbox" class="toggle ml-2" checked />
	</div>
	<div class="flex-none dropdown ml-2">
		<label tabindex="0" class="btn btn-outline m-1" for="clockspeed-dropdown">Speed: 1hz</label>
		<ul
			tabindex="0"
			id="clockspeed-dropdown"
			class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
		>
			<li><a>KEKW</a></li>
			{#each clockspeedOptions as opt}
				<!-- svelte-ignore a11y-missing-attribute -->
				<li><a>{opt} Hz</a></li>
			{/each}
			<input
				class="dropdown-content w-48 h-12 input"
				type="number"
				min="0"
				max="20"
				step="0.1"
				value="1"
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
				<li><a>{style}</a></li>
			{/each}
		</ul>
	</div>
</div>
