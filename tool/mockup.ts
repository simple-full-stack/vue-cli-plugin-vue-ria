import * as bodyParser from 'body-parser';

const apiPrefixReg = /^\/data\//;

export default function (app, resolve) {
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    const handler = (req, res, next) => mockupHandler(req, res, next, resolve);

    app.get(apiPrefixReg, handler);
    app.post(apiPrefixReg, handler);
}

function mockupHandler(req, res, next, resolve) {
    if (req.headers.referer && /[?&](?:ed|enable_debug)\b/i.test('' + req.headers.referer)) {
        try {
            let modulePath = resolve(req.path.replace(apiPrefixReg, 'mockup/')) + '.js';
            delete require.cache[modulePath];
            if (/upload$/.test(req.path)) {
                res.type('html');
            }
            else {
                res.type('json');
            }
            let module = require(modulePath);
            module(req, res, next);
        }
        catch (e) {
            console.error(e);
            res.sendStatus(500);
        }
    }
    else {
        next();
    }
}
