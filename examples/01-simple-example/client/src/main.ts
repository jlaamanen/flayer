import { configure } from "server-pkg";
import App from "./App.svelte";

configure({
  url: "ws://localhost:1234",
});

const app = new App({
  target: document.getElementById("app"),
});

export default app;
