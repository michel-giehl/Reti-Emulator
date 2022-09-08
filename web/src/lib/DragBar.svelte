<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import ArrowSplitVertical from 'svelte-material-icons/ArrowSplitVertical.svelte';

	export let leftContainer: string;
	export let rightContainer: string;
	let dragging = false;

	const dispatch = createEventDispatcher();

	function dragStart(e: MouseEvent | TouchEvent) {
		e.preventDefault();
		dragging = true;
		document.body.classList.add('cursor-col-resize');
		dispatch('dragstart')
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
				const leftPercentageBefore = codeWindow?.style.width;
				const rightPercentageBefore = stateWindow?.style.width;
				if (codeWindow && stateWindow) {
					codeWindow.style.width = `${percentage}%`;
					stateWindow.style.width = `${mainPercentage}%`;
					dispatch('sizechange', {
						before: {
							left: leftPercentageBefore,
							right: rightPercentageBefore
						},
						after: {
							left: percentage,
							right: mainPercentage
						}
					});
				}
			}
		}
	}

	function dragEnd(e: MouseEvent | TouchEvent) {
		dragging = false;
		document.body.classList.remove('cursor-col-resize');
		dispatch('dragend')
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
	<svelte:component this={ArrowSplitVertical} size="50" />
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
