<script lang="ts">
  import { getLoggedInUser } from "server-pkg/user";
  import LoggedInView from "./LoggedInView.svelte";
  import LoginForm from "./LoginForm.svelte";
  import UsersTable from "./UsersTable.svelte";

  let userPromise = getLoggedInUser();

  function reloadLoggedInUser() {
    userPromise = getLoggedInUser();
  }
</script>

<main>
  {#await userPromise}
    <div>Loading...</div>
  {:then user}
    {#if !user?.username}
      <LoginForm on:login={reloadLoggedInUser} />
      <UsersTable />
    {:else}
      <LoggedInView {user} on:logout={reloadLoggedInUser} />
    {/if}
  {/await}
</main>

<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }
</style>
