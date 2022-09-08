# Flayer

> **Warning!** ⚠️
>
> This library is experimental and should be used with caution.

Make interactions between your TypeScript frontend and Node.js backend seamless: invoke your backend functions directly from your frontend.

No more manual serialization or wrapping & unwrapping the data on the server or the client. Just use the functions as they were written in the first place.

## Quick start

### Server setup

1. Install Flayer to your Node.js backend application
   ```bash
   npm i flayer
   ```
2. Write a module file exporting the functions you want to expose

   ```ts
   // ./modules/someModule.ts

   export function hello(name: string) {
     return `Hello ${name}!`;
   }
   ```

3. Create and start a Flayer server with your modules

   ```ts
   import { createServer } from "flayer";

   const server = createServer({
     someModule: require("./modules/someModule"),
   });

   server.start({
     port: 1234,
   });
   ```

4. Generate a client package on server restart when in development mode
   ```ts
   if (process.env.NODE_ENV === "development") {
     server.generatePackage({
       path: "../server-pkg",
     });
   }
   ```

### Client setup

1. After generating the client package the first time, install it to your frontend application
   ```bash
   npm i ../server-pkg
   ```
2. Configure the client package on app initialization

   ```ts
   import { configure } from "server-pkg";

   configure({
     url: "ws://localhost:1234",
   });
   ```

3. Start using the backend functions in your frontend code!

   ```ts
   import { hello } from "server-pkg/someModule";

   console.log(hello("World")); // "Hello World!"
   ```

## More detailed examples

Check https://github.com/jlaamanen/flayer-example for a more thorough example. To try it out yourself, copy the example repository by running:

```sh
npx degit jlaamanen/flayer-example
```
