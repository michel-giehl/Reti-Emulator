<script context="module" lang="ts">
	import { writable } from 'svelte/store';
	import { fade, fly } from 'svelte/transition';

	export type NotificationType = 'info' | 'success' | 'warning' | 'error';

	let timer: NodeJS.Timeout | null = null;

	let t: NotificationType = 'info';
	let notification = writable({
		icon: true,
		type: t,
		text: '',
		show: false
	});

	export function statusText(i: boolean, t: NotificationType, str: string) {
		notification.set({
			icon: i,
			type: t,
			text: str,
			show: true
		});
		if (timer !== null) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => {
			notification.update((u) => {
				u.show = false;
				return u;
			});
		}, 2000);
	}
</script>

<script lang="ts">
	const iconData = {
		info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
		success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
		warning:
			'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
		error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
	};

	const alertType = {
		info: 'alert-info',
		success: 'alert-success',
		error: 'alert-error',
		warning: 'alert-warning'
	};
</script>

{#if $notification.show}
	<div class="z-40 fixed w-full h-auto overflow-auto">
		<div
			class="alert {alertType[
				$notification.type
			]} shadow-lg w-1/4 z-40 fixed left-0 right-2 top-5 ml-auto"
			in:fade={{ duration: 100 }}
			out:fly={{ y: 20, duration: 800 }}
		>
			<div>
				{#if $notification.icon}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="stroke-current flex-shrink-0 w-6 h-6"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d={iconData[$notification.type]}
						/></svg
					>
				{/if}
				<span>{$notification.text}</span>
			</div>
		</div>
	</div>
{/if}