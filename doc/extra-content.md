### DisableValidation

If you want to bypass the validation, you can pass `disableValidation` as true.

```ts
import { betterFetch } from 'better-fetch';
import { z } from 'zod';

const { data, error } = await betterFetch("https://jsonplaceholder.typicode.com/todos/1", {
    output: z.object({
        userId: z.string(),
        id: z.number(),
        title: z.string(),
        completed: z.boolean(),
    }),
    disableValidation: true
});
```