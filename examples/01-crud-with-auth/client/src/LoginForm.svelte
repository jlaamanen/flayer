<script lang="ts">
  import { authenticate } from "server-pkg/user";
  import { createEventDispatcher } from "svelte";

  let username = "";
  let password = "";

  const dispatch = createEventDispatcher();

  async function handleLogin() {
    try {
      await authenticate(username, password);
      dispatch("login");
    } catch (error) {
      alert(`Login failed:\n\n${error.message}`);
    }
  }
</script>

<h1>Login</h1>
<form on:submit|preventDefault={handleLogin}>
  <input
    type="text"
    placeholder="Username"
    autocomplete="username"
    bind:value={username}
  />
  <input
    type="password"
    placeholder="Password"
    autocomplete="current-password"
    bind:value={password}
  />
  <button type="submit">Login</button>
</form>
