import {each} from 'lodash';
import addEntry from '../tool/addEntry';

export default function entry(api, projectOptions, webpackConfig) {
  const entries = projectOptions.pluginOptions[require('../package.json').name].entries;
  if (!entries || !Object.keys(entries).length) {
    throw new Error('No entry.');
  }
  webpackConfig.entryPoints.delete('app');
  each(entries, (config, name) => {
    addEntry(webpackConfig, name, api.resolve.bind(api), config);
  });
}
