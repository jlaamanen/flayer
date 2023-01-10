import { configure } from "server-pkg";
import App from "./App.svelte";

configure({
  url: `ws://${window.location.hostname}:1234`,
});

const app = new App({
  target: document.getElementById("app"),
});

export default app;
