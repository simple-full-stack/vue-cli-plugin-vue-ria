const httpProxy = require('http-proxy');
const {get, some} = require('lodash');

export default function (app, proxyTable) {
    const proxy = httpProxy.createProxyServer({});
    proxy.on('error', (e) => {
        console.error(e);
    });
    proxy.on('proxyReq', (proxyReq, req, _, options) => {
        const path = get(req, 'path', '');
        const href = get(options, 'target.href', '').replace(/\/$/, '');
        const proxyPath = get(proxyReq, 'path', '');
        console.log(`[proxy] ${path} -> ${href}${proxyPath}`);
    });

    app.use((req, res, next) => {
        if (!some(proxyTable, (options, field) => {
            if (typeof options === 'string') {
                options = {
                    target: options,
                    logLevel: 'debug'
                };
            }

            const defaultFilter = function (pathname, req) {
                return !/[?&](?:ed|enable_debug)\b/.test('' + req.headers.referer)
                    && new RegExp(field).test(pathname);
            };

            const filter = get(options, 'filter') || defaultFilter;
            if (filter(req.path, req)) {
                proxy.web(req, res, options);
                return true;
            }

            return false;
        })) {
            next();
        }
    });
}
