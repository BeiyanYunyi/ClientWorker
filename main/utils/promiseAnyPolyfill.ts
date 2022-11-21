if (!Promise.any) {
  Promise.any = function (promises: Promise<unknown>[]) {
    return new Promise((resolve, reject) => {
      promises = Array.isArray(promises) ? promises : [];
      let len = promises.length;
      let errs: unknown[] = [];
      if (len === 0)
        return reject(new AggregateError("All promises were rejected"));
      promises.forEach((promise) => {
        promise.then(
          (value) => {
            resolve(value);
          },
          (err) => {
            len--;
            errs.push(err);
            if (len === 0) {
              reject(new AggregateError(errs));
            }
          }
        );
      });
    });
  };
}

export {};
