# Better Fetch

Advanced fetch wrapper for typescript that returns data and error object, supports defined routes with zod schemas, callbacks, plugins, react hooks and more. Works on the browser, node (version 18+), workers, deno and bun.

## Installation

```bash
pnpm install @better-fetch/fetch
```

## Basic Usage

```typescript
import betterFetch from "@better-fetch/fetch"


const { data, error } = await betterFetch<{
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}>("https://jsonplaceholder.typicode.com/todos/1");
if (error) {
  // handle the error
}
if (data) {
  // handle the data
}
```
`data` will be the response data inferred from the generic type.

`error` object will be the response error by default it has the `status` and `statusText` properties.

If the api returns a json error object it will be parsed and returned with the error object. By default `error` includes `message` property that can be string or undefined. You can pass a custom error type to be inferred as a second generic argument.

### ♯ Create a custom fetch

You can create a custom fetch with default options.

```typescript
import { createFetch } from "@better-fetch/fetch";

const $fetch = createFetch({
  baseUrl: "https://jsonplaceholder.typicode.com",
  retry: 2,
});

const { data, error } = await $fetch<{
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}>("/todos/1");
```

### ♯ Typed Fetch (Route Schema)

Better fetch allows you to define zod schema that will be used to infer request body, query parameters, response data and error types.

```bash 
  pnpm install zod
```

```typescript
import { createFetch } from "@better-fetch/fetch";
import { FetchSchema } from "@better-fetch/fetch/typed";
import { z } from "zod";
const routes = {
  /**
   * 
   * You can define a route with output schema. The output schema 
   * will be used to infer the response data.
   * If no input schema is defined, by default the get method 
   * will be used.
   */
  "/": {
      output: z.object({
      message: z.string(),
    }),
  },
  /**
   * You can define a route with input schema. The input schema 
   * will be used to infer the request body.
   * And by default the post method will be used. 
   * see `@method` modifier to define other methods.
   */
  "/signin": {
    input: z.object({
      username: z.string(),
      password: z.string(),
    }),
    output: z.object({
      token: z.string(),
    }),
  },
  /**
   * You can define a route with query schema. The query schema w
   * ill be used to infer the query parameters.
   */
  "/query": {
    query: z.object({
      term: z.string(),
    }),
  },
  /**
   * You can define dynamic parameters. The params will be 
   * inferred as prams with the key id.
   */
  "/param/:id": {},
  /**
   * You can define params with multiple keys. The params 
   * will be inferred as string array in the order defined.
   */
  "/multi-params/:id/:id": {
  },
  /**
   * You can also define params like query. The params will be
   * inferred as object with the keys defined.
   */
  "/multi-params": {
      params: {
          id: z.string(),
          name: z.string()
      }
  },
  /**
   * You can define same route with different methods using 
   * `@method` modifier.
   * 
   * When you call the route `@method` modifier will be ignored 
   * from the path  and the method will be used.
   */
  "@get/path": {
      output: z.object({
          message: z.string()
      })
  }
  "@post/path": {
      output: z.object({
          message: z.string()
      })
  }
} satisfies FetchSchema;

const $fetch = createFetch({
  routes: routes,
})
```

**♯ Using the schema only for typing**

If you only want to use the schema for type inference only and not validating your input and outputs, you can instead pass it as a generic.

- the first argument of the generic is default `data` type.
- the second argument is default `error` type. Make sure to pass `unknown` if you're not passing an object for default type. Passing `any` will break the typing.
- you pass the schema type in the 3rd argument of the generics.

```ts
const $fetch = createFetch<any, unknown, typeof routes>()
```


By default if you define schema better fetch still allows you to make a call to other routes that's not defined on the schema. If you want to enforce only the keys defined to be inferred as valid you can use the `strict` helper.

```typescript
import { createFetch } from "@better-fetch/fetch";
import { FetchSchema, strict } from "@better-fetch/fetch/typed";
const schema = {
  "/": {}
} satisfies FetchSchema
const $fetch = createFetch({
  routes: strict(schema)
})

//this will type error
$fetch("/custom")
```

### ♯ Default Response and Error Type
You can also pass default response and error types. Which will be used if you don't pass the types in the fetch call.

```typescript
import { createFetch } from "@better-fetch/fetch";
import { DefaultSchema } from "@better-fetch/fetch/typed";

const $fetch = createFetch<{
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}, {
  message: string;
}>({
  baseUrl: "https://jsonplaceholder.typicode.com",
  retry: 2,
});

const { data, error } = await $fetch("/todos/1");
//data and error types are inferred from the default types

const { data, error } = await $fetch<{
  some: string;
}, {
  fields: string[]
}>("/todos/1");
//data and error types are inferred from fetch call
```


### ♯ Using with React
To use better fetch with React hooks, you have the option to import createReactFetch. This allows you to create hooks with custom defaults like createFetch and returns two hooks `useFetch` and `useMutate`. Alternatively, you can directly import each individual hook.


With createReactFetch, you can create hooks with custom defaults.
```typescript
import {  createReactFetch  } from "@better-fetch/fetch/react";

//create hooks with custom defaults
const { useFetch, useMutate } = createReactFetch({
  baseUrl: "https://jsonplaceholder.typicode.com",
  retry: 2,
});

function App() {
  type Todo = {
    userId: number;
    id: number;
    title: string;
    completed: boolean;
  };
  const { data, error, isPending } = useFetch<Todo>("/todos/1");
  if (error) {
    // handle the error
  }
  if (data) {
    // handle the data
  }
  const { mutate, isPending } = useMutate<Todo>("/todos")
  await mutate({
    userId: 1,
    id: 1,
    title: "delectus aut autem",
    completed: false 
  })
}
```

Alternatively, you can directly import each individual hook.
```typescript
import { useFetch, useMutate } from "@better-fetch/fetch/react";

function App() {
  const { data, error } = useFetch<{
    userId: number;
    id: number;
    title: string;
    completed: boolean;
  }>("https://jsonplaceholder.typicode.com/todos/1");
  if (error) {
    // handle the error
  }
  if (data) {
    // handle the data
  }
}
```


### ♯ Plugins

Plugins are functions that can be used to modify the request, response, error and other parts of the request lifecycle.

Example: a plugin that adds csrf token to the request body
```typescript
const csrfProtection = async (url, options) => {
  if (options?.method !== "GET") {
    options.body = {
      ...options?.body,
      csrfToken: await getCSRFToken(),
    };
  }
  return { url, options };
}
```

```typescript
import { createFetch } from "@better-fetch/fetch";
import { csrfProtection } from "./plugins/csrfProtection"

const $fetch = createFetch({
  baseUrl: "https://jsonplaceholder.typicode.com",
  retry: 2,
  plugins: [csrfProtection()]
});
```

- Plugin should be a function that returns a promise that resolves to an object with url and options.
- The options object should be the same as the fetch options object. 
- They'll be called before the request is made. 
- If you want the hook into a request lifecycle you can add callbacks to the options object.
- plugins are called in the order they are defined.



### ♯ Handling Errors

By default better fetch will return the error object if the request fails. You can also pass the throw option to throw if the request fails.

```typescript
const { data, error } = await fetch<
  {
    userId: number;
    id: number;
    title: string;
    completed;
  },
  {
    message: string;
  }
>("https://jsonplaceholder.typicode.com/todos/1");
if (error) {
  // handle the error
}
```

> throws if the request fails

```typescript
const { data, error } = await fetch<{
  userId: number;
  id: number;
  title: string;
  completed;
}>("https://jsonplaceholder.typicode.com/todos/1", {
  throw: true,
});
```


### ♯ Parsing the response

Better fetch will smartly parse JSON using JSON.parse and if it fails it will return the response as text.

For binary content types, better fetch will instead return a Blob object.

You can also pass custom parser.

```typescript
//parsed as JSON
const { data, error } = await fetch("/todos/1");
// Get the blob version of the response
const { data, error } = await fetch("/api/image.png");
// Return text as is
await ofetch("/ok");
//custom parser
const { data, error } = await fetch("/todos/1", {
  parser: (text) => {
    return JSON.parse(text);
  },
});
```

### ♯ Auto Retry

You can set the number of retries.

```typescript
const { data, error } = await fetch<{
  userId: number;
  id: number;
  title: string;
  completed;
}>("https://jsonplaceholder.typicode.com/todos/1", {
  retry: 2,
});
```

### ♯ Timeout

You can set the timeout in milliseconds.

```typescript
const { data, error } = await fetch<{
  userId: number;
  id: number;
  title: string;
  completed;
}>("https://jsonplaceholder.typicode.com/todos/1", {
  timeout: 5000,
});
```

### ♯ Query Parameters

You can pass the query parameters as an object.

```typescript
const { data, error } = await fetch<{
  userId: number;
  id: number;
  title: string;
  completed;
}>("https://jsonplaceholder.typicode.com/todos/1", {
  query: {
    userId: 1,
  },
});
```

### ♯ Headers

You can pass the headers as an object.

```typescript
const { data, error } = await fetch<{
  userId: number;
  id: number;
  title: string;
  completed;
}>("https://jsonplaceholder.typicode.com/todos/1", {
  headers: {
    "Content-Type": "application/json",
  },
});
```

### ♯ Authorization

You can pass the authorization that will be added to the headers.

Currently, supports `Bearer` and `Basic` authorization.

```typescript
const { data, error } = await fetch<{
  userId: number;
  id: number;
  title: string;
  completed;
}>("https://jsonplaceholder.typicode.com/todos/1", {
  authorization: {
    type: "Bearer",
    token: "token",
  },
});
```

### ♯ Method

You can pass the method as a string.

```typescript
const { data, error } = await fetch<{
  userId: number;
  id: number;
  title: string;
  completed;
}>("https://jsonplaceholder.typicode.com/todos/1", {
  method: "POST",
});
```

### ♯ Callbacks

You can pass callbacks for different events on the request lifecycle.

```typescript
const { data, error } = await fetch<{
  userId: number;
  id: number;
  title: string;
  completed;
}>("https://jsonplaceholder.typicode.com/todos/1", {
  onRequest: (request) => {
    console.log("Requesting", request);
  },
  onResponse: (response) => {
    console.log("Response", response);
  },
  onError: (error) => {
    console.log("Error", error);
  },
  onSuccess: (data) => {
    console.log("Success", data);
  },
  onRetry: (retry) => {
    console.log("Retrying", retry);
  },
});
```

### ♯ Native Fetch

You can use the native fetch by calling the native method.

```typescript
import betterFetch from "better-fetch";
const res = await betterFetch.native(
  "https://jsonplaceholder.typicode.com/todos/1"
);
```

## License

MIT
