/**
 * @file 用户信息模块
 * @author Justineo(justice360@gmail.com) Chestnut
 */

import {extend, each, clone, isString} from 'lodash';
import qs from 'qs';
import Auth from './Auth';
import {purify} from '../utils/lang';

// 'VISITOR_ONLY' 'ADER_ONLY' 'CEILING' 'FLOOR'
function getAuthMapByCompare(user, type) {
    let visitor = user.getVisitor();
    let ader = user.getAder();
    if (!ader) {
        return visitor.auth;
    }

    let authMap = clone(visitor.auth);
    each(ader.auth, (value, field) => {
        if (!authMap[field]) {
            authMap[field] = value;
            return;
        }

        let priorityMap = {
            none: 1,
            readonly: 2,
            editable: 3
        };
        if (type === 'CEILING'
            ? (priorityMap[value] > authMap[field])
            : (priorityMap[value] < authMap[field])
        ) {
            authMap[field] = priorityMap[value];
        }
    });
    return authMap;
}
const DEFAULT_AUTH_MERGE_STRATEGIES = {
    VISITOR_ONLY(user) {
        return user.getVisitor().auth;
    },
    ADER_ONLY(user) {
        let ader = user.getAder();
        return ader ? ader.auth : user.getVisitor().auth;
    },
    CEILING(user) {
        return getAuthMapByCompare(user, 'CEILING');
    },
    FLOOR(user) {
        return getAuthMapByCompare(user, 'FLOOR');
    }
};

const DEFAULT_OPTIONS = {
    selfKey: 'visitor',
    userKey: 'adOwner',
    idKey: 'aderId',
    authMergeStrategy: 'ADER_ONLY'
};

export default class User {
    auth = new Auth();

    constructor() {
        this.options = DEFAULT_OPTIONS;

        this.authMap = null;
    }

    mergeOptions(options) {
        extend(this.options, options);

        if (isString(this.options.authMergeStrategy)) {
            this.options.authMergeStrategy = DEFAULT_AUTH_MERGE_STRATEGIES[this.options.authMergeStrategy];
        }
    }

    init(session) {
        let options = this.options;
        if (session[options.selfKey]) {
            this.visitor = session[options.selfKey];
        }
        if (session[options.userKey]) {
            this.ader = session[options.userKey];
        }
        if (!session[options.selfKey] && !session[options.userKey]) {
            this.visitor = session;
        }

        // 初始化权限
        this.authMap = this.options.authMergeStrategy(this);
    }

    getVisitor() {
        return this.visitor || null;
    }

    getVisitorId() {
        return this.visitor && this.visitor.id;
    }

    getAder() {
        return this.ader || null;
    }

    getAderId() {
        let idKey = this.options.idKey;
        return (this.ader && this.ader.id)
            || qs.parse(document.location.search.slice(1))[idKey];
    }

    getAderArgMap() {
        let id = this.getAderId();
        let args = {
            [this.options.idKey]: id
        };
        return purify(args);
    }

    getAuthMap() {
        return this.authMap;
    }

    getAuthType(authId) {
        return this.auth.get(authId, this.getAuthMap());
    }

    getAuth(authId) {
        let authType = this.getAuthType(authId);
        return {
            type: authType,
            id: authId,
            isReadOnly: authType === Auth.TYPE.READONLY,
            isEditable: authType === Auth.TYPE.EDITABLE,
            isVisible: authType !== Auth.TYPE.NONE,
            isNone: authType === Auth.TYPE.NONE
        };
    }
}
