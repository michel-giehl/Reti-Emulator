<script>
	import { setup, draw } from '$lib/canvas.js';
	import { onMount } from 'svelte';

	onMount(() => {
		setup();
		draw();
	});
</script>

<div id="canvas" class="w-[2400px] h-[1000px]" />
