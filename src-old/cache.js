/*
 * Cache
 * This is inteded to increase performance
 * Using caching can make perfance for serving the website close to the performance of using static files
 * The one caveot is the first time you render a page after the server being started it will not be optomized yet
 * The cache is stored in memory
 */

// TODO look into alowing cache to be stored and managed outside of memory

exports.memoize = fn => {
  return variadic.bind(
    this,
    fn,
    new Cache()
  );
};

/*
 * https://en.wikipedia.org/wiki/Variadic_function
 * This just means it is expeting multiple arguments, but it will work with 0 and 1
 */
function variadic(fn, cache) {
  const args = Array.prototype.slice.call(arguments, 2);
  const cacheKey = JSON.stringify(args);
  let computedValue = cache.get(cacheKey);
  if (typeof computedValue === 'undefined') {
    computedValue = fn.apply(this, args);
    cache.set(cacheKey, computedValue);
  }
  return computedValue;
}

// Basic in memory cache class
class Cache {
  constructor() {
    this.cache = Object.create(null);
  }

  has(key) {
    return (key in this.cache);
  }

  get(key) {
    return this.cache[key];
  }

  set(key, value) {
    this.cache[key] = value;
  }
}
