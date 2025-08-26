<script lang="ts">
  import '../app.css';

  let {children} = $props();
</script>

<svelte:head>
  <link
    rel="icon"
    href="/favicon.png"
  />
  <title>Yanxin's Resume</title>

</svelte:head>

{@render children?.()}
