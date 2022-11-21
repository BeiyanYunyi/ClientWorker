import engineClassic from "./classic";
import engineCrazy from "./crazy";
import engineFetch from "./fetch";
import engineKFC from "./KFCThursdayVW50";
import engineParallel from "./parallel";

const FetchEngine = {
  fetch: engineFetch,
  crazy: engineCrazy,
  KFCThursdayVW50: engineKFC,
  classic: engineClassic,
  parallel: engineParallel,
};

export default FetchEngine;
