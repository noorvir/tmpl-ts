module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // @module api
      // Hermes cannot parse the rest parameter pattern in @orpc/client.
      "@babel/plugin-transform-parameters",
      // @end-module
    ],
  };
};
