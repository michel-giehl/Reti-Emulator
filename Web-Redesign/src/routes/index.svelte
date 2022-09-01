<script lang="ts">
	import CodeMirror from '$lib/CodeMirror.svelte';
	import DragBar from '$lib/DragBar.svelte';
	import { onMount } from 'svelte';
	import { themeChange } from 'theme-change';

	import EditorControlsNavBar from '$lib/components/EditorControlsNavbar.svelte';
	import RetiControlsNavbar from '$lib/components/RetiControlsNavbar.svelte';

	import RetiAnimation from '$lib/RetiAnimation.svelte';

	import { runReti, save } from '$lib/reti/controls';
	import Alert from '$lib/components/Alert.svelte';
	import { showAnimation } from '$lib/reti/global_vars';
	import RetiState from '$lib/RetiState.svelte';
	import LoadingScreen from '$lib/LoadingScreen.svelte';

	onMount(() => {
		themeChange(false);
	});

	// Navbar stuff
	let clockspeedOptions = [0.1, 0.2, 0.3, 0.5];
	clockspeedOptions.push(...[...Array(5).keys()].map((i) => i + 1));

	let numberStyles = ['Binary', 'Decimal', 'Hexadecimal'];

	let themes = [
		'solarized',
		'solarized dark',
		'basic light',
		'basic dark',
		'gruxbox light',
		'gruvbox dark',
		'material',
		'nord'
	];

	let size = '32';
</script>

<Alert />

<div class="h-screen w-screen overflow-x-hidden flex flex-col">
	<div class="flex-initial h-6" />
	<div class="flex flex-row w-screen">
		<EditorControlsNavBar
			{size}
			on:run={async () => {
				await runReti();
			}}
			on:save={() => {
				save();
			}}
		/>
		<div class="divider divider-horizontal" />
		<RetiControlsNavbar {clockspeedOptions} {numberStyles} />
	</div>

	<div id="main-container" class="flex flex-1 w-screen">
		<CodeMirror />
		<DragBar leftContainer="left" rightContainer="state-window" />
		<div
			id="state-window"
			class="w-1/2 overflow-scroll"
			on:mousewheel={(e) => {
				const stateWindow = document.getElementById('state-window');
				if (stateWindow === null) return;
				stateWindow.scrollLeft += e.deltaY;
			}}
		>
			{#if $showAnimation}
				<RetiAnimation />
			{:else}
				<RetiState />
			{/if}
		</div>
	</div>
</div>

<style>
	@tailwind components;
	.divider:after {
		@apply bg-black;
	}
	.divider:before {
		@apply bg-black;;
	}
</style>