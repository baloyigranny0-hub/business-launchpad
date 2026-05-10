// Tiny logger that silences in production builds.
const isDev = process.env.NODE_ENV !== "production";
const noop = () => {};

const log = {
  error: isDev ? console.error.bind(console) : noop,
  warn:  isDev ? console.warn.bind(console)  : noop,
  info:  isDev ? console.info.bind(console)  : noop,
  debug: isDev ? console.debug.bind(console) : noop,
};

export default log;
