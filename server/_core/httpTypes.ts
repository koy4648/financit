export type AppLike = {
  get: (...args: any[]) => unknown;
  use: (...args: any[]) => unknown;
};

export type RequestLike = {
  headers?: Record<string, string | string[] | undefined>;
  hostname?: string;
  params?: unknown;
  protocol?: string;
  query?: Record<string, unknown>;
};

export type ResponseLike = {
  clearCookie: (name: string, options?: unknown) => unknown;
  cookie: (name: string, value: string, options?: unknown) => unknown;
  json: (body: unknown) => unknown;
  redirect: (statusOrUrl: number | string, url?: string) => unknown;
  status: (code: number) => ResponseLike;
};

export type SessionCookieOptions = {
  domain?: string;
  httpOnly: boolean;
  path: string;
  sameSite: "none" | "lax";
  secure: boolean;
};
