<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';

onLaunch(() => {
  // The storefront currently uses preview content until its API adapter is connected.
});
</script>

<style>
page { min-height: 100%; background: var(--v19-canvas); color: var(--v19-ink); }
view, text, button { box-sizing: border-box; }
button, uni-button { margin: 0; padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; line-height: inherit; }
button::after, uni-button::after { border: 0; }
</style>
