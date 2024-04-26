import { describe, it, beforeAll, expect, afterAll } from "vitest";

import { createReactFetch, useFetch, useMutate } from "../src/react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { createApp, eventHandler, readBody, toNodeListener } from "h3";
import { listen, Listener } from "listhen";
import { act } from "react-dom/test-utils";
import { sleep } from "./utils";

describe("react", () => {
  const getURL = (path?: string) =>
    path ? `http://localhost:3006${path}` : "http://localhost:3006";
  let listener: Listener;
  beforeAll(async () => {
    let count = 0;
    const app = createApp()
      .use(
        "/text",
        eventHandler(() => "OK")
      )
      .use(
        "/count",
        eventHandler(() => {
          return String(++count);
        })
      )
      .use(
        "/post",
        eventHandler(async (req) => {
          const body = await readBody(req);
          return body;
        })
      )
      .use(
        "/get",
        eventHandler(() => {
          return { foo: "bar" };
        })
      );
    listener = await listen(toNodeListener(app), {
      port: 3006,
    });
  });

  afterAll(() => {
    listener.close().catch(console.error);
  });

  it("should work", async () => {
    function Page() {
      const { data } = useFetch<string>(getURL("/text"));
      return <div>data:{data}</div>;
    }
    const { getByText } = render(<Page />);
    await waitFor(() => getByText("data:OK"));
  });

  it("should refetch", async () => {
    function Page() {
      const { data, refetch } = useFetch<string>(getURL("/count"));
      return (
        <div>
          <div>data:{data}</div>
          <button onClick={refetch} type="button">
            refetch
          </button>
        </div>
      );
    }
    const { getByText } = render(<Page />);
    await waitFor(() => getByText("data:1"));
    fireEvent.click(getByText("refetch"));
    await waitFor(() => getByText("data:2"));
  });

  it("should refetch in interval", async () => {
    function Page() {
      const { data, refetch } = useFetch<string>(getURL("/count"), {
        refetchInterval: 100,
      });
      return (
        <div>
          <div>data:{data}</div>
          <button onClick={refetch} type="button">
            refetch
          </button>
        </div>
      );
    }
    render(<Page />);
    await sleep(200);
    screen.getByText("data:4");
  });

  it("should refetch on focus", async () => {
    function Page() {
      const { data } = useFetch<string>(getURL("/count"), {
        refetchOnFocus: true,
      });
      return <div>data:{data}</div>;
    }

    const { getByText } = render(<Page />);
    await waitFor(() => getByText("data:5"));
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    await waitFor(() => getByText("data:6"));
  });

  it("should cache", async () => {
    function Page() {
      const { data } = useFetch<string>(getURL("/count"), {
        refetchOnMount: false,
      });
      return <div>data:{data}</div>;
    }
    const { getByText } = render(<Page />);
    await waitFor(() => getByText("data:6"));
  });

  it("shouldn't use cache", async () => {
    function Page() {
      const { data } = useFetch<{
        foo: string;
      }>(getURL("/get"), {
        refetchOnMount: false,
      });
      console.log({ data });
      return <div>data:{data?.foo}</div>;
    }
    const { getByText } = render(<Page />);
    await waitFor(() => getByText("data:bar"));
  });

  it("should use initial data", async () => {
    function Page() {
      const { data } = useFetch<string>(getURL("/count"), {
        initialData: "0",
      });
      return <div>data:{data}</div>;
    }
    const { getByText } = render(<Page />);
    await waitFor(() => getByText("data:0"));
  });

  it("should mutate", async () => {
    function Page() {
      const mutate = useMutate<{ name: string }>(getURL("/post"));

      return (
        <div>
          <button
            onClick={async () => {
              const res = await mutate.mutate({
                name: "foo",
              });
              expect(res.data).toMatchObject({ name: "foo" });
            }}
            type="button"
          >
            invalidate
          </button>
        </div>
      );
    }
    const { getByText } = render(<Page />);
    fireEvent.click(getByText("invalidate"));
    await sleep(100);
  });

  it("should work with create", async () => {
    const { useFetch: useFetch2 } = createReactFetch({
      baseURL: getURL(),
    });
    function Page() {
      const { data } = useFetch2<string>("/text");
      return <div>data:{data}</div>;
    }
    const { getByText } = render(<Page />);
    await waitFor(() => getByText("data:OK"));
  });
});
