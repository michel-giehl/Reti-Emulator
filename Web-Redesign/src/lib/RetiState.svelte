<script lang="ts">
	import { registerNames, reti, isFetching, phase, numberStyle } from '$lib/global_vars';
	import { stringifyNumber } from '$lib/NumberUtils';
	import { decompile } from '$lib/reti_decompiler';
	import { browser } from '$app/environment';
</script>

<div class="h-full w-full flex flex-col">
	<div class="w-auto h-auto whitespace-nowrap">
		<p class="font-mono text-3xl p-2" id="instruction-counter">
			Instruction {$reti.registers[0]} | {$isFetching ? 'FETCH P' : 'EXECUTE P'}{$isFetching
				? $phase === 0
					? $phase
					: $phase + 1
				: $phase}
		</p>
		<p class="font-mono text-3xl p-2" id="instruction-display">{decompile($reti.registers[8])}</p>
	</div>
	<div class="relative flex w-auto h-auto p-1">
		<div class="flex flex-col w-full lg:flex-row">
			{#each $reti.registers as register, idx}
				<div class="grid flex-grow h-16 w-32 card bg-base-300 rounded-box place-items-center mr-2">
					<p class="register-text text-lg ml-4 mr-4">{registerNames[idx]}</p>
					<p class="register-text text-sm ml-4 mr-4">{stringifyNumber(register, $numberStyle)}</p>
				</div>
			{/each}
		</div>
	</div>

	<div class="flex flex-row w-full h-[600px] p-3 overflow-y-hidden">
		<div class="flex flex-col w-1/3 font-mono">
			<div class="overflow-x-auto  overflow-y-scroll">
				<table class="table table-zebra w-full">
					<!-- head -->
					<thead>
						<tr class="sticky top-0 z-10 text-center">
							<th>Address</th>
							<th>Data</th>
						</tr>
					</thead>
					<colgroup>
						<col span="1" style="width: 20%;" />
						<col span="1" style="width: 80%;" />
					</colgroup>
					<tbody>
						<!-- row 2 -->
						{#each $reti.sram as data, addr}
							{#if data !== undefined}
								<tr class={$reti.registers[0] === addr ? 'active text-info' : ''}>
									<td class="text-left">{addr}</td>
									<td class="text-left"
										>{addr < $reti.bds ? decompile(data) : stringifyNumber(data, $numberStyle)}</td
									>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- UART -->
		<div class="flex flex-col w-1/4 font-mono ml-auto">
			<span class="text-center pt-5">UART</span>
			<div class="overflow-y-scroll hide-scrollbar">
				<div class="inline-block w-full">
					<div class="overflow-x-visible">
						<table class="table table-zebra w-full">
							<!-- head -->
							<thead>
								<tr>
									<th>Register</th>
									<th>Data</th>
								</tr>
							</thead>
							<tbody>
								<!-- row 2 -->
								{#each $reti.uart as data, addr}
									{#if data !== undefined}
										<tr>
											<td class="text-left">R{addr}</td>
											<td class="text-left">{data.toString(2).padStart(8, '0')}</td>
										</tr>
									{/if}
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
