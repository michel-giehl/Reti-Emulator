<script>
	import { setup, draw } from '$lib/canvas.js';
	import { onMount } from 'svelte';
	import { reti, phase, isFetching } from '$lib/global_vars';
	import { decompile } from '$lib/reti_decompiler';

	onMount(() => {
		setup();
		draw();
	});
</script>

<span class="font-mono whitespace-nowrap text-md sm:text-sm xl:text-xl 2xl:text-2xl"
	>Instruction {$reti.registers[0]}: {decompile($reti.registers[8])} | {$isFetching
		? 'FETCH P'
		: 'EXECUTE P'}{$isFetching ? ($phase === 0 ? $phase : $phase + 1) : $phase}</span
>

<div id="canvas" class="w-[2400px] h-[1000px]" />
