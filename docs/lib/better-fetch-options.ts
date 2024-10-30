import { BetterFetchOption, BetterFetchPlugin } from "@better-fetch/fetch";

type BetterFetchOptions = Omit<BetterFetchOption, keyof RequestInit>;
export type { BetterFetchPlugin, BetterFetchOptions, BetterFetchOption };
