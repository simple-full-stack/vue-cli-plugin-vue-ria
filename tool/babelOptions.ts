export default function babelOptions(api) {
  return {
    cacheDirectory: true,
    configFile: false,
    babelrc: false,
    ...JSON.parse(require('fs').readFileSync(api.resolve('.babelrc')))
  };
}
