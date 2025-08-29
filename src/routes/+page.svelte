<script lang="ts">
  import {onMount, onDestroy} from 'svelte';
  import {initializeScene} from '$lib/three/main';

  let container: HTMLDivElement;
  let cleanup: () => void;

  onMount(() => {
    if (container) {
      const {destroy} = initializeScene(container);
      cleanup = destroy;
    }
  });

  onDestroy(() => {
    if (cleanup) {
      cleanup();
    }
  });
</script>

<div
  bind:this={container}
  class="w-screen h-dvh touch-none"
/>
