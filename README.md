# Better Fetch

A fetch wrapper for typescript that returns data and error object, supports defined route schemas, plugins and more. Works on the browser, node (version 18+), workers, deno and bun.

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
  completed;
}>("https://jsonplaceholder.typicode.com/todos/1");
if (error) {
  // handle the error
}
if (data) {
  // handle the data
}
```

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
	"/": {
		output: z.object({
			message: z.string(),
		}),
	},
	"/signin": {
		input: z.object({
			username: z.string(),
			password: z.string(),
		}),
		output: z.object({
			token: z.string(),
		}),
	},
	"/signup": {
		input: z.object({
			username: z.string(),
			password: z.string(),
			optional: z.optional(z.string()),
		}),
		output: z.object({
			message: z.string(),
		}),
	},
	"/query": {
		query: z.object({
			term: z.string(),
		}),
	},
  /**
   * You can also define params. The params will be inferred as 
   * prams with the key id.
   */
  "/param/:id": {},
  /**
   * You can also define params with multiple keys. The params 
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
   */
  "@get/method": {
      output: z.object({
          message: z.string()
      })
  }
  "@post/method": {
      output: z.object({
          message: z.string()
      })
  }
} satisfies FetchSchema;

const $fetch = createFetch({
  routes: routes,
})
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

You can also pass default response and error types. Which will be used if you don't pass the types in the fetch call.

```typescript
import { createFetch } from "@better-fetch/fetch";
import { DefaultSchema } from "@better-fetch/fetch/typed";

const $fetch = createFetch<DefaultSchema,{
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
To use better fetch with React hooks, you have the option to import createReactFetch. This allows you to create hooks with custom defaults. Alternatively, you can directly import each individual hook.


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

Example:
```typescript
import { createFetch } from "@better-fetch/fetch";
import { csrfProtection } from "./plugins/csrfProtection"

const $fetch = createFetch({
  baseUrl: "https://jsonplaceholder.typicode.com",
  retry: 2,
  plugins: [csrfProtection()]
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
