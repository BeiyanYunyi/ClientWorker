import cons from './cons.js'

const FetchEngine = {
    fetch: async (req, config) => {
        config = config || { status: 200, mode: "cors", credential: "include", redirect: "follow", cache: "default" }
        return new Promise((resolve, reject) => {
            const reqtype = Object.prototype.toString.call(req)
            if (reqtype !== '[object String]' && reqtype !== '[object Request]') {
                reject(`FetchEngine.fetch: req must be a string or Request object,but got ${reqtype}`)
            }
            fetch(req, {
                mode: config.mode,
                credentials: config.credential,
                redirect: config.redirect,
                cache: config.cache
            }).then(res => {
                resolve(res)
            }).catch(err => { reject(err) })
        })

    },
    classic: async (reqs, config) => {
        return new Promise((resolve, reject) => {
            config = config || { status: 200, mode: "cors", credential: "include", redirect: "follow", cache: "default" }
            const reqtype = Object.prototype.toString.call(reqs)
            if (reqtype === '[object String]' || reqtype === '[object Request]') {
                cons.w(`FetchEngine.classic: reqs should be an array,but got ${reqtype},this request will downgrade to normal fetch`)
                resolve(FetchEngine.fetch(reqs, config))
            } else if (reqtype !== '[object Array]') {
                reject(`FetchEngine.classic: reqs must be a string , Request or Array object,but got ${reqtype}`)
            } else if (reqtype === '[object Array]') {
                if (reqtype.length === 0) reject(`FetchEngine.classic: reqs array is empty`)
                if (reqtype.length === 1) {
                    cons.w(`FetchEngine.classic: reqs array is only one element,this request will downgrade to normal fetch`)
                    resolve(FetchEngine.fetch(reqs[0], config))
                }
            }
            const controller = new AbortController();
            const PauseProgress = async (res) => {
                return new Response(await (res).arrayBuffer(), { status: res.status, headers: res.headers, statusText: res.statusText });
            };

            Promise.any(reqs.map(req => {
                fetch(req, {
                    signal: controller.signal,
                    mode: config.mode,
                    credentials: config.credential,
                    redirect: config.redirect,
                    cache: config.cache
                })
                    .then(PauseProgress)
                    .then(res => {
                        if (res.status == config.status || 200) {
                            controller.abort();
                            resolve(res)
                        }
                    }).catch(err => {
                        if (err == 'DOMException: The user aborted a request.') console.log()//To diable the warning:DOMException: The user aborted a request.
                        reject(err)
                    })
            }))




        })
    },
    parallel: async (reqs, config) => {
        return new Promise((resolve, reject) => {
            config = config || { status: 200, mode: "cors", credential: "include", redirect: "follow", cache: "default" }
        
            const reqtype = Object.prototype.toString.call(reqs)
            if (reqtype === '[object String]' || reqtype === '[object Request]') {
                cons.w(`FetchEngine.parallel: reqs should be an array,but got ${reqtype},this request will downgrade to normal fetch`)
                resolve(FetchEngine.fetch(reqs, config))
            } else if (reqtype !== '[object Array]') {
                reject(`FetchEngine.parallel: reqs must be a string , Request or Array object,but got ${reqtype}`)
            } else if (reqtype === '[object Array]') {
                if (reqtype.length === 0) reject(`FetchEngine.parallel: reqs array is empty`)
                if (reqtype.length === 1) {
                    cons.w(`FetchEngine.parallel: reqs array is only one element,this request will downgrade to normal fetch`)
                    resolve(FetchEngine.fetch(reqs[0], config))
                }
            }
            const abortEvent = new Event("abortOtherInstance")
            const eventTarget = new EventTarget();
            Promise.any(reqs.map(async req => {
                let controller = new AbortController(), tagged = false;
                eventTarget.addEventListener(abortEvent.type, () => {
                    if (!tagged) controller.abort()
                })
                fetch(req, {
                    signal: controller.signal,
                    mode: config.mode,
                    credentials: config.credential,
                    redirect: config.redirect,
                    cache: config.cache
                }).then(res => {
                    if (res.status == config.status || 200) {
                        tagged = true;
                        eventTarget.dispatchEvent(abortEvent)
                        resolve(res)
                    }
                }).catch(err => {
                    if (err == 'DOMException: The user aborted a request.') console.log()//To diable the warning:DOMException: The user aborted a request.
                    reject(err)
                })
            }))




        })
    }
}

export default FetchEngine