<script lang="ts">

	let simple = false;
	let lol = [...new Array(100).keys()];
</script>

<div class="h-full w-full flex flex-col">
	<div class="w-auto h-auto">
		<p class="text theme-transition" id="instruction-counter">Instruction 0</p>
		<p class="text theme-transition" id="instruction-display">LOADI PC 0</p>
	</div>
	<div class="relative flex w-auto h-auto p-1">
		<div class="register">
			<p class="register-text text-3xl">PC</p>
			<p class="register-text text-lg">{(Math.pow(2, 31) - 1).toString(16)}</p>
		</div>
		<div class="register">
			<p class="register-text text-3xl">IN1</p>
			<p class="register-text text-lg">{(Math.pow(2, 31) - 1).toString(16)}</p>
		</div>
		<div class="register">
			<p class="register-text text-3xl">IN2</p>
			<p class="register-text text-lg">{(Math.pow(2, 31) - 1).toString(16)}</p>
		</div>
		<div class="register">
			<p class="register-text text-3xl">ACC</p>
			<p class="register-text text-lg">{(Math.pow(2, 31) - 1).toString(16)}</p>
		</div>
		{#if !simple}
			<div class="register">
				<p class="register-text text-3xl">SP</p>
				<p class="register-text text-lg">{(Math.pow(2, 31) - 1).toString(16)}</p>
			</div>
			<div class="register">
				<p class="register-text text-3xl">BAF</p>
				<p class="register-text text-lg">{(Math.pow(2, 31) - 1).toString(16)}</p>
			</div>
			<div class="register">
				<p class="register-text text-3xl">CS</p>
				<p class="register-text text-lg">{(Math.pow(2, 31) - 1).toString(16)}</p>
			</div>
			<div class="register">
				<p class="register-text text-3xl">DS</p>
				<p class="register-text text-lg">{(Math.pow(2, 31) - 1).toString(16)}</p>
			</div>
		{/if}
	</div>

	<div class="flex flex-row w-full h-full p-3 overflow-y-hidden">
		<div class="flex flex-col w-2/5 font-mono">
			<span class="text-center pt-5">SRAM</span>
			<div class="overflow-y-scroll overflow-x-hidden hide-scrollbar">
				<div class="inline-block w-full">
					<div class="overflow-x-visible">
						<table class="min-w-full">
							<thead class="border-b">
								<tr class="sticky top-0 dark:bg-slate-700 bg-neutral-300 theme-transition">
									<th scope="col" class="text-base font-medium px-2 py-2 text-center"> Address </th>
									<th scope="col" class="text-base font-medium px-2 py-2 text-center"> Data </th>
								</tr>
							</thead>
							<tbody>
								{#each lol as _}
									<tr class="{_ % 2 ? 'dark:bg-slate-800 bg-slate-300' : 'dark:bg-slate-900 bg-white'} border-b theme-transition">
										<td class="text-lg text-center font-medium px-2 py-1 whitespace-nowrap">{_}</td>
										<td class="text-sm text-right font-light px-4 py-1 whitespace-nowrap">
											{Math.floor(Math.random() * Math.pow(2, 31)).toString(10)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>

		<!-- UART -->
		<div class="flex flex-col w-1/4 font-mono ml-auto">
			<span class="text-center pt-5">UART</span>
			<div class="overflow-y-scroll hide-scrollbar">
				<div class="inline-block w-full">
					<div class="overflow-x-visible">
						<table class="min-w-full">
							<thead class="bg-white border-b">
								<tr class="sticky top-0 dark:bg-slate-700 bg-neutral-300 theme-transition">
									<th scope="col" class="text-base font-medium  px-2 py-2 text-center">
										Register
									</th>
									<th scope="col" class="text-base font-medium  px-2 py-2 text-center"> Data </th>
								</tr>
							</thead>
							<tbody>
								{#each [...new Array(8).keys()] as _}
								<tr class="{_ % 2 ? 'dark:bg-slate-800 bg-slate-300' : 'dark:bg-slate-900 bg-white'} border-b theme-transition">
										<td class="text-lg text-center  font-medium px-2 py-1 whitespace-nowrap">{_}</td
										>
										<td class="text-sm text-right  font-light px-6 py-1 whitespace-nowrap">
											{Math.floor(Math.random() * 255)
												.toString(2)
												.padStart(8, '0')}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@tailwind components;

	@layer components {
		.text {
			@apply font-mono text-3xl p-2;
		}

		/* Hide scrollbar for Chrome, Safari and Opera */
		.hide-scrollbar::-webkit-scrollbar {
			display: none;
		}

		/* Hide scrollbar for IE, Edge and Firefox */
		.hide-scrollbar {
			-ms-overflow-style: none; /* IE and Edge */
			scrollbar-width: none; /* Firefox */
		}
	}
</style>
