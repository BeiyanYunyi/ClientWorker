import { FetchEngineFunction } from "./types";

const engineFetch: FetchEngineFunction = async (req, config) => {
  config = config || { status: 200 };
  return new Promise((resolve, reject) => {
    const reqtype = Object.prototype.toString.call(req);
    if (reqtype !== "[object String]" && reqtype !== "[object Request]") {
      reject(
        `FetchEngine.fetch: req must be a string or Request object,but got ${reqtype}`
      );
    }
    setTimeout(() => {
      reject(
        new Response(
          "504 All GateWays Failed,ClientWorker Show This Page,Engine Fetch",
          { status: 504, statusText: "504 All Gateways Timeout" }
        )
      );
    }, config.timeout || 5000);
    fetch(req, {
      mode: config.mode,
      credentials: config.credentials,
      redirect: config.redirect || "follow",
    })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export default engineFetch;
