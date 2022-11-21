export type FetchEngineConfig = Partial<{
  mode: RequestMode;
  credentials: RequestCredentials;
  timeout: number;
  redirect: RequestRedirect;
  threads: number;
  trylimit: number;
  status: number;
  signal: AbortSignal;
}>;

export type FetchEngineFunction = (
  req: Request,
  config: FetchEngineConfig
) => Promise<Response>;

export type FetchEngineParallelFunction = (
  reqs: Request[] | Request,
  config: FetchEngineConfig
) => Promise<Response>;
