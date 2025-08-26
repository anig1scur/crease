<script lang="ts">
  import '../app.css';
  import {resolveAsset} from '$lib/config';

  let {children} = $props();
</script>

<svelte:head>
  <link
    rel="icon"
    href={resolveAsset('favicon.png')}
  />
  <title>Yanxin's Resume</title>
</svelte:head>

{@render children?.()}
