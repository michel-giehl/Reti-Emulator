<script lang="ts">
	import CodeMirror from '$lib/CodeMirror.svelte';
	import DragBar from '$lib/DragBar.svelte';
	import { onMount } from 'svelte';
	import { themeChange } from 'theme-change';

	import EditorControlsNavBar from '$lib/navbar/EditorControlsNavbar.svelte';
	import RetiControlsNavbar from '$lib/navbar/RetiControlsNavbar.svelte';

	import RetiAnimation from '$lib/RetiAnimation.svelte';

	onMount(() => {
		themeChange(false);
	});

	// Navbar stuff
	let clockspeedOptions = [0.1, 0.2, 0.3, 0.5]
	clockspeedOptions.push(...[...Array(5).keys()].map(i => i + 1));

	let numberStyles = ['Binary', 'Binary (short)', 'Decimal', 'Hexadecimal'];

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

<div class="h-screen w-screen">
	<div class="w-full h-20" />
	<div class="flex flex-row w-screen">
		<EditorControlsNavBar {size} {themes} />
		<div class="divider divider-horizontal" />
		<RetiControlsNavbar {clockspeedOptions} {numberStyles}/>
	</div>

	<div id="main-container" class="flex flex-row w-screen h-5/6">
		<CodeMirror />
		<DragBar leftContainer="left" rightContainer="state-window" />
		<div id="state-window" class="w-1/2 h-full overflow-y-hidden overflow-x-scroll">
			<!--<RetiState /> -->
			<RetiAnimation />
		</div>
	</div>
</div>
