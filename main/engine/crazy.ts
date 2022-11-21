import cons from "../utils/cons";
import rebuild from "../utils/rebuild";
import engineFetch from "./fetch";
import { FetchEngineFunction } from "./types";

const engineCrazy: FetchEngineFunction = async (req, config) => {
  config = config || { status: 200 };
  config.threads = config.threads || 4;
  config.trylimit = config.trylimit || 10;
  const reqtype = Object.prototype.toString.call(req);
  if (reqtype !== "[object String]" && reqtype !== "[object Request]") {
    cons.e(
      `FetchEngine.fetch: req must be a string or Request object,but got ${reqtype}`
    );
    throw new Error(
      `FetchEngine.fetch: req must be a string or Request object,but got ${reqtype}`
    );
  }
  const controller = new AbortController();
  const PreFetch = await fetch(req, {
    signal: controller.signal,
    mode: config.mode,
    credentials: config.credentials,
    redirect: config.redirect || "follow",
  });
  const PreHeaders = PreFetch.headers;
  const AllSize = PreHeaders.get("Content-Length");
  if (
    config.status &&
    PreFetch.status.toString().match(config.status.toString())
  ) {
    return new Response(
      "504 All GateWays Failed,ClientWorker Show This Page,Engine Crazy",
      { status: 504, statusText: "504 All Gateways Timeout" }
    );
  }
  controller.abort();
  if (!AllSize || Number(AllSize) < config.threads) {
    cons.e(
      `FetchEngine.crazy: The Origin is not support Crazy Mode,or the size of the file is less than ${config.threads} bytes,downgrade to normal fetch`
    );
    return engineFetch(req, config);
  }
  return new Promise((resolve, reject) => {
    const chunkSize = Math.floor(Number(AllSize) / config.threads!);
    const chunks: Promise<ArrayBuffer | undefined>[] = [];
    for (let i = 0; i < config.threads!; i++) {
      chunks.push(
        new Promise(async (res, rej) => {
          let trycount = 1;
          const instance = async (): Promise<ArrayBuffer> => {
            trycount += 1;
            const nReq = rebuild.request(req, {
              headers: {
                Range: `bytes=${i * chunkSize}-${(i + 1) * chunkSize - 1}`,
              },
              url: req.url,
            });
            return fetch(nReq, {
              mode: config.mode,
              credentials: config.credentials,
              redirect: config.redirect || "follow",
            })
              .then((res) => res.arrayBuffer())
              .catch((err) => {
                if (trycount >= config.trylimit!) {
                  reject();
                }
                return instance();
              });
          };
          res(instance());
        })
      );
    }
    Promise.all(chunks).then((responses) => {
      const resbodys: BlobPart[] = [];
      for (let i = 0; i < responses.length; i++) {
        resbodys.push(responses[i]!);
      }
      resolve(
        new Response(new Blob(resbodys), {
          headers: PreHeaders,
          status: 200,
          statusText: "OK",
        })
      );
    });
    setTimeout(() => {
      reject(
        new Response(
          "504 All GateWays Failed,ClientWorker Show This Page,Engine Crazy",
          { status: 504, statusText: "504 All Gateways Timeout" }
        )
      );
    }, config.timeout || 5000);
  });
};

export default engineCrazy;
