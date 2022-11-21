import cons from "../utils/cons";
import engineFetch from "./fetch";
import { FetchEngineParallelFunction } from "./types";

const engineClassic: FetchEngineParallelFunction = async (reqs, config) => {
  return new Promise((resolve, reject) => {
    config = config || { status: 200 };
    const reqtype = Object.prototype.toString.call(reqs);
    if (reqtype === "[object String]" || reqtype === "[object Request]") {
      cons.w(
        `FetchEngine.classic: reqs should be an array,but got ${reqtype},this request will downgrade to normal fetch`
      );
      resolve(engineFetch(reqs as Request, config));
    } else if (reqtype !== "[object Array]") {
      cons.e(
        `FetchEngine.classic: reqs must be a string , Request or Array object,but got ${reqtype}`
      );
      reject();
    } else if (reqtype === "[object Array]") {
      if (reqtype.length === 0) {
        cons.e(`FetchEngine.classic: reqs array is empty`);
        reject();
      }
      if (reqtype.length === 1) {
        cons.w(
          `FetchEngine.classic: reqs array is only one element,this request will downgrade to normal fetch`
        );
        resolve(engineFetch((reqs as Request[])[0], config));
      }
    }
    const controller = new AbortController();
    const PauseProgress = async (res: Response) => {
      return new Response(await res.arrayBuffer(), {
        status: res.status,
        headers: res.headers,
        statusText: res.statusText,
      });
    };
    Promise.any(
      (reqs as Request[]).map((req) => {
        fetch(req, {
          signal: controller.signal,
          mode: config.mode,
          credentials: config.credentials,
          redirect: config.redirect || "follow",
        })
          .then(PauseProgress)
          .then((res) => {
            if (
              config.status &&
              res.status.toString().match(config.status.toString())
            ) {
              controller.abort();
              resolve(res);
            }
          })
          .catch((err) => {
            if (err == "DOMException: The user aborted a request.")
              console.log(); //To disable the warning:DOMException: The user aborted a request.
          });
      })
    );
    setTimeout(() => {
      reject(
        new Response(
          "504 All GateWays Failed,ClientWorker Show This Page,Engine Classic",
          { status: 504, statusText: "504 All Gateways Timeout" }
        )
      );
    }, config.timeout || 5000);
  });
};

export default engineClassic;
