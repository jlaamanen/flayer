<script lang="ts">
  import type { Product } from "server-pkg/products";

  export let product: Product;
</script>

<div class="card">
  <h3>{product.name}</h3>
  <p>Price: {product.price}</p>
</div>

<style>
  .card {
    border: 1px solid #aaa;
    border-radius: 3px;
    margin: 0 auto;
    margin-bottom: 2rem;
    max-width: 30rem;
  }
</style>
