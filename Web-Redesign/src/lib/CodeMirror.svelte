<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { retiCode, codeMirror, strokeColor, editorMode } from '$lib/reti/global_vars';
  import {retiValidator, picoCValidator} from "$lib/reti/linters.js"

	onMount(() => {
		// Initialize CodeMirror
		codeMirror.set(
			CodeMirror.fromTextArea(document.getElementById('editor'), {
				mode: 'reti',
				lineNumbers: true,
				lineWrapping: false,
				enterMode: 'keep',
				theme: 'material-darker',
				gutters: ['CodeMirror-line-numbers', 'CodeMirror-lint-markers'],
				lint: { options: { async: true } }
			})
		);
	});
  CodeMirror.registerHelper("lint", "reti", retiValidator)
  CodeMirror.registerHelper("lint", "clike", picoCValidator)
</script>

<div id="left" class="text-black w-1/2 text-base overflow-y-scroll">
	<textarea id="editor" />
</div>

