# Better Fetch

A fetch wrapper for typescript that returns data and error object. Works on the browser, node (version 18+), workers, deno and bun. Some of the APIs are inspired by [ofetch](https://github.com/unjs/ofetch).

## Installation

```bash
pnpm install @better-tools/fetch
```

## Usage

```typescript
import fetch from "@better-tools/fetch"

const { data, error } = await fetch<{
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
import { createFetch } from "@better-tools/fetch";

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

You can also pass default response and error types. Which will be used if you don't pass the types in the fetch call.

```typescript
import { createFetch } from "@better-tools/fetch";

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
To use better fetch with React hooks, you have the option to import createReactFetch. This allows you to create hooks with custom defaults. Alternatively, you can directly import each individual hook.


With createReactFetch, you can create hooks with custom defaults.
```typescript
import {  createReactFetch  } from "@better-tools/fetch/react";

//create hooks with custom defaults
const { useFetch, useMutate } = createReactFetch({
  baseUrl: "https://jsonplaceholder.typicode.com",
  retry: 2,
});

function App() {
  const { data, error } = useFetch<{
    userId: number;
    id: number;
    title: string;
    completed: boolean;
  }>("/todos/1");
  if (error) {
    // handle the error
  }
  if (data) {
    // handle the data
  }
}
```

Alternatively, you can directly import each individual hook.
```typescript
import { useFetch, useMutate } from "@better-tools/fetch/react";

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


### ♯ Typed Fetch
Better fetch allows you to define schema that will be used to infer request body, query parameters, response data and error types.

```typescript
import { createFetch } from "@better-tools/fetch";
import { T, FetchSchema } from "@better-tools/fetch/typed";

const routes = {
	"/": {
		output: T.Object({
			message: T.String(),
		}),
	},
	"/signin": {
		input: T.Object({
			username: T.String(),
			password: T.String(),
		}),
		output: T.Object({
			token: T.String(),
		}),
	},
	"/signup": {
		input: T.Object({
			username: T.String(),
			password: T.String(),
			optional: T.Optional(T.String()),
		}),
		output: T.Object({
			message: T.String(),
		}),
	},
} satisfies FetchSchema;

const $fetch = createFetch<typeof routes>()
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
