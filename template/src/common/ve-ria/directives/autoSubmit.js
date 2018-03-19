/**
 * @file autoSubmit
 * @author zhangli25(zhangli25@baidu.com)
 */

import {includes, keys, get} from 'lodash';

export default {
    bind(el, {modifiers}, vnode) {
        const input = vnode.componentInstance;
        if (!input || !includes(input.$options.uiTypes, 'input')) {
            return;
        }

        const form = get(input, 'formField.form');
        if (form && includes(form.$options.uiTypes, 'form')) {
            keys(modifiers).forEach(eventName => {
                input.$on(eventName, () => form.submit());
            });
        }
    }
};
