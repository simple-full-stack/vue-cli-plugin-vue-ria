/**
 * @file 简单实现一下withQuery
 * @author Chestnut
 */
import {isUndefined, extend, isEmpty} from 'lodash';
import qs from 'qs';

function getUrl(path, query) {
    return isEmpty(query) ? path : `${path}?${qs.stringify(query)}`;
}

export class URI {

    /**
     * 覆盖或添加query
     *
     * @param  {string} url     合法的encode过的url
     * @param  {Object} query   query params
     * @return {string}         url
     */
    withQuery(url, query) {
        let parts = url.split('#');

        let headParts = parts[0].split('?');
        // 非 hash 部分不能有多个 `?`
        if (headParts.length > 2) {
            return url;
        }

        // 不管 hash 是一串什么东西，反正最后拼接上去就好了
        parts = [...headParts, parts[1]];

        // 只有path
        if (isUndefined(parts[1])) {
            return getUrl(parts[0], query);
        }

        // 没有query但存在hash
        if (isUndefined(parts[2]) && url.indexOf('#') !== -1) {
            return `${getUrl(parts[0], query)}#${parts[1]}`;
        }

        // 有query，可能有hash
        url = getUrl(parts[0], extend(qs.parse(parts[1]), query));
        return url + `${isUndefined(parts[2]) ? '' : ('#' + parts[2])}`;
    }
}

export default new URI();
