<script lang="ts">
	import CodeMirror from '$lib/components/CodeMirror.svelte';
	import DragBar from '$lib/components/DragBar.svelte';
	import { onMount } from 'svelte';
	import { themeChange } from 'theme-change';

	import EditorControlsNavBar from '$lib/components/EditorControlsNavbar.svelte';
	import RetiControlsNavbar from '$lib/components/RetiControlsNavbar.svelte';

	import RetiAnimation from '$lib/components/RetiAnimation.svelte';

	import Alert from '$lib/components/Alert.svelte';
	import { showAnimation } from '$lib/global_vars';
	import RetiState from '$lib/components/RetiState.svelte';

	onMount(() => {
		themeChange(false);
	});
</script>

<Alert />

<div class="h-screen w-screen overflow-x-hidden flex flex-col">
	<div class="flex flex-0 flex-row w-screen">
		<EditorControlsNavBar />
		<RetiControlsNavbar />
	</div>

	<div id="main-container" class="flex flex-1 w-screen overflow-y-auto">
		<CodeMirror />
		<DragBar leftContainer="left" rightContainer="state-window"/>
		<div
			id="state-window"
			class="w-1/2 {$showAnimation ? "overflow-x-scroll" : "overflow-hidden"}"
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
		@apply bg-black;
	}
</style>
