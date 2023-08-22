import fetch, { RequestInit, Response } from "node-fetch";
export interface RequestInitWithTimeout extends RequestInit {
  timeout?: number;
}

export const timeout = <T>(ms: number, fn: () => Promise<T>) => {
  return new Promise<T>((resolve, reject) => {
    const handle = setTimeout(() => {
      reject(Error("timed out"));
    }, ms);

    fn()
      .then((...ret) => {
        clearTimeout(handle);
        resolve(...ret);
      })
      .catch((err) => {
        clearTimeout(handle);
        reject(err);
      });
  });
};

export const sleep = (duration) => {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
};

export const semaphore = () => {
  let resolvePromise;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });
  return {
    release: () => {
      resolvePromise();
    },
    wait: (timeoutMs) => {
      if (!timeoutMs) return promise;
      return Promise.race([promise, sleep(timeoutMs)]);
    },
  };
};

/**
 * Returns the input array, shuffled.
 */
export const shuffle = <T>(arr: T[]) => {
  const randos = arr.map(() => Math.random());
  return Object.keys(arr)
    .sort((idx1, idx2) => {
      return randos[idx1] - randos[idx2];
    })
    .map<T>((idx) => arr[idx]);
};

export const fetchWithTimeout = (
  url: string,
  options: RequestInitWithTimeout
) =>
  new Promise<Response>((resolve, reject) => {
    let timeout = setTimeout(() => {
      timeout = null;
      reject("timeout");
    }, options.timeout || 10 * 1000);
    return fetch(url, options).then(
      (response) => {
        if (timeout === null) {
          // already timed out
          return;
        }
        clearTimeout(timeout);
        return resolve(response);
      },
      (rejectReason) => {
        if (timeout === null) {
          // already timed out
          return;
        }
        clearTimeout(timeout);
        return reject(rejectReason);
      }
    );
  });

export const fetchWithTimeoutAndRedirects = async (
  url: string,
  options: RequestInitWithTimeout,
  redirectCount = 5
): Promise<Response> => {
  // Throw error if maximum number of redirects has been exceeded
  if (redirectCount < 0) {
    throw new Error("Maximum number of redirects exceeded");
  }

  options = { ...options, redirect: "manual" };

  return new Promise<Response>((resolve, reject) => {
    let timeout = setTimeout(() => {
      timeout = null;
      reject("timeout");
    }, options.timeout || 10 * 1000);

    fetch(url, options).then(
      async (response) => {
        if (timeout === null) {
          // already timed out
          return;
        }

        clearTimeout(timeout);

        // Handle redirects
        if (response.status >= 300 && response.status < 400) {
          const newUrl = response.headers.get("location");
          if (!newUrl) {
            reject("Redirect with no location");
            return;
          }

          const newResponse = await fetchWithTimeoutAndRedirects(
            newUrl,
            options,
            redirectCount - 1
          );
          resolve(newResponse);
        } else {
          resolve(response);
        }
      },
      (rejectReason) => {
        if (timeout === null) {
          // already timed out
          return;
        }

        clearTimeout(timeout);
        reject(rejectReason);
      }
    );
  });
};

// turns foo-bar-baz into fooBarBaz
export const kebabToCamel = (str: string) => {
  let out = "";
  let upper = false;
  for (let i = 0; i < str.length; i += 1) {
    const char = str[i];
    if (char === "-") {
      upper = true;
    } else if (upper === true) {
      out += char.toUpperCase();
      upper = false;
    } else {
      out += char;
    }
  }
  return out;
};
