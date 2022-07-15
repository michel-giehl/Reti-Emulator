<script lang="ts">
	import ArrowSplitVertical from 'svelte-material-icons/ArrowSplitVertical.svelte';
	export let leftContainer: string;
	export let rightContainer: string;
	let dragging = false;

	function dragStart(e: MouseEvent | TouchEvent) {
		e.preventDefault();
		dragging = true;
		document.body.classList.add('cursor-col-resize');
	}

	function dragMove(e: MouseEvent) {
		if (dragging) {
			let percentage = (e.pageX / window.innerWidth) * 100;
			let mainPercentage = 0;
			if (percentage >= 2 && percentage <= 98) {
				// snap to 50 %
				if (percentage >= 49.5 && percentage <= 50.5) {
					percentage = 50.0;
				}
				mainPercentage = 100 - percentage;
				let codeWindow = document.getElementById(leftContainer);
				let stateWindow = document.getElementById(rightContainer);
				if (codeWindow && stateWindow) {
					codeWindow.style.width = `${percentage}%`;
					stateWindow.style.width = `${mainPercentage}%`;
				}
			}
		}
	}

	function dragEnd(e: MouseEvent | TouchEvent) {
		dragging = false;
		document.body.classList.remove('cursor-col-resize');
	}
</script>

<svelte:window on:mousemove={dragMove} on:mouseup={dragEnd} on:touchend={dragEnd} />

<div
	id="dragger"
	class="divider divider-horizontal hover:cursor-col-resize m-0.5"
	on:mousedown={dragStart}
	on:touchstart={dragStart}
	on:mousemove={dragMove}
>
<svelte:component this={ArrowSplitVertical} size=50></svelte:component>
</div>

<style>
</style>
