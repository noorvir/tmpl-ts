type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * A wrapper function to never throw but instead make error handling explicit a la Golang.
 * Accepts either a Promise or a function that returns a value.
 * For synchronous error handling, pass a function: tc(() => somethingThatMightThrow())
 * For async error handling, pass a Promise: tc(someAsyncFunction())
 * @param arg - Either a Promise or a function that returns a value
 * @returns A Result object with either data or error
 */
function tryCatch<T, E = Error>(value: Promise<T>): Promise<Result<T, E>>;
function tryCatch<T, E = Error>(value: () => T): Result<T, E>;
function tryCatch<T, E = Error>(arg: Promise<T> | (() => T)): Result<T, E> | Promise<Result<T, E>> {
  if (typeof arg === 'function') {
    try {
      const data = arg();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as E };
    }
  }

  return arg.then((data) => ({ data, error: null })).catch((error) => ({ data: null, error: error as E }));
}
export { tryCatch as tc };

export function wrapError(error: Error, message: string): Error & { message: string } {
  if ('message' in error) {
    error.message = `${message}: ${error.message}`;
    return error;
  }
  // @ts-ignore
  error.message = `${message}`;
  return error;
}

