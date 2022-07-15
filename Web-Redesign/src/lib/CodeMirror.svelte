<script>
	import { createEventDispatcher, onMount } from 'svelte';

	let code = `LOADI ACC 0`;

	onMount(() => {
		let editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
			mode: 'reti',
			lineNumbers: true,
			lineWrapping: false,
			enterMode: 'keep',
			theme: 'monokai',
			gutters: ['CodeMirror-line-numbers', 'CodeMirror-lint-markers'],
			lint: { options: { async: true } }
		});
		editor.setValue(
			'LOADI SP 100      ; use SP as counter' +
				'\nLOADI IN1 0       ; IN1 = 0' +
				'\nLOADI IN2 1       ; IN2 = 1' +
				'\nLOADI ACC 0       ; ACC = 0' +
				'\nMOVE IN1 ACC      ; ACC = IN1 + IN2' +
				'\nADD ACC IN2       ; ACC = IN1 + IN2' +
				'\nMOVE IN2 IN1      ; IN1 = IN2' +
				'\nMOVE ACC IN2      ; IN2 = ACC' +
				'\nSTOREIN SP IN1 0  ; store in SRAM' +
				'\nADDI SP 1         ; increment counter' +
				'\nJUMP -6           ; loop forever'
		);
	});
</script>

<div id="left" class="text-black w-1/2 text-base overflow-y-scroll">
	<textarea id="editor"/>
</div>