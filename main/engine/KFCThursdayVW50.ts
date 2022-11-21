import cons from "../utils/cons";
import rebuild from "../utils/rebuild";
import engineCrazy from "./crazy";
import engineFetch from "./fetch";
import engineParallel from "./parallel";
import { FetchEngineParallelFunction } from "./types";

const engineKFC: FetchEngineParallelFunction = async (reqs, config) => {
  config = config || { status: 200 };
  config.threads = config.threads || 4;
  config.trylimit = config.trylimit || 10;
  const reqtype = Object.prototype.toString.call(reqs);
  if (reqtype === "[object String]" || reqtype === "[object Request]") {
    cons.w(
      `FetchEngine.KFCThursdayVW50: reqs is a string or Request object,downgrade to crazy`
    );
    return engineCrazy(reqs as Request, config);
  } else if (reqtype !== "[object Array]") {
    cons.e(
      `FetchEngine.KFCThursdayVW50: reqs must be a string or Request object or an array,but got ${reqtype}`
    );
    return Promise.reject(
      `FetchEngine.KFCThursdayVW50: reqs must be a string or Request object or an array,but got ${reqtype}`
    );
  } else if (reqtype === "[object Array]") {
    if ((reqs as Request[]).length === 0) {
      cons.e(`FetchEngine.KFCThursdayVW50: reqs array is empty`);
      throw new Error("FetchEngine.KFCThursdayVW50: reqs array is empty");
    }
    if ((reqs as Request[]).length === 1) {
      cons.w(
        `FetchEngine.KFCThursdayVW50: reqs array is only one,downgrade to crazy`
      );
      return engineCrazy((reqs as Request[])[0], config);
    }
  }
  const controller = new AbortController();
  const PreFetch = await engineParallel(reqs, {
    signal: controller.signal,
    mode: config.mode,
    credentials: config.credentials,
    redirect: config.redirect || "follow",
    timeout: config.timeout || 30000,
  });

  const PreHeaders = PreFetch.headers;
  const AllSize = PreHeaders.get("Content-Length");
  if (
    config.status &&
    PreFetch.status.toString().match(config.status.toString())
  ) {
    return Promise.reject(
      new Response(
        "504 All GateWays Failed,ClientWorker Show This Page,Engine KFCThursdayVW50",
        { status: 504, statusText: "504 All Gateways Timeout" }
      )
    );
  }
  controller.abort();
  if (!AllSize || Number(AllSize) < config.threads) {
    cons.e(
      `FetchEngine.KFCThursdayVW50: The Origin is not support KFCThursdayVW50 Mode,or the size of the file is less than ${config.threads} bytes,downgrade to normal fetch`
    );
    return engineFetch(reqs as Request, config);
  }
  return new Promise((resolve, reject) => {
    const chunkSize = Math.floor(Number(AllSize) / config.threads!);
    const chunks: Promise<ArrayBuffer>[] = [];
    for (let i = 0; i < config.threads!; i++) {
      chunks.push(
        new Promise(async (res, rej) => {
          let trycount = 1;
          const instance = async (): Promise<ArrayBuffer> => {
            trycount += 1;
            const nReqs: Request[] = [];
            (reqs as Request[]).forEach((req) => {
              nReqs.push(
                rebuild.request(req, {
                  headers: {
                    Range: `bytes=${i * chunkSize}-${(i + 1) * chunkSize - 1}`,
                  },
                  url: req.url,
                })
              );
            });
            return engineParallel(nReqs, {
              mode: config.mode,
              credentials: config.credentials,
              redirect: config.redirect || "follow",
              timeout: config.timeout || 30000,
              status: 206,
            })
              .then((res) => res.arrayBuffer())
              .catch(async (err) => {
                cons.e(`FetchEngine.KFCThursdayVW50: ${await err.text()}`);
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
        resbodys.push(responses[i]);
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
          "504 All GateWays Failed,ClientWorker Show This Page,Engine KFCThursdayVW50",
          { status: 504, statusText: "504 All Gateways Timeout" }
        )
      );
    }, config.timeout || 30000);
  });
};

export default engineKFC;
