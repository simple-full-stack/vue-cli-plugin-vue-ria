import {mapValues} from 'lodash';

export default function getEnv() {
    return mapValues(process.env, (value, key) => `"${value.replace(/"/g, '\\"')}"`);
}
