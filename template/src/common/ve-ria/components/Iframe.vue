<template>
    <iframe class="ria-iframe"
        :name="name"
        :src="src"
        ref="iframe"
        :scrolling="scrolling"
        @load="loadHandler"
        @message="messageHandler">
    </iframe>
</template>

<script>
import {isFunction, uniqueId} from 'lodash';

export default {
    props: {
        src: String,
        name: {
            type: String,
            default: uniqueId('iframe')
        },
        contentHtml: String,
        scrolling: {
            type: String,
            default: 'no'
        },
        autoWidth: {
            type: Boolean,
            default: true
        },
        autoHeight: {
            type: Boolean,
            default: true
        },
        autoSizeDelay: {
            type: Number,
            default: 0
        }
    },
    mounted() {
        this.contentWindow = this.$refs.iframe.contentWindow;
        if (this.contentHtml) {
            this.setContentHtml(this.contentHtml);
        }
    },
    watch: {
        contentHtml(v) {
            this.setContentHtml(v);
        }
    },
    methods: {
        messageHandler(e) {
            this.$emit('message', e);
        },
        loadHandler(e) {
            let el = this.$refs.iframe;
            let size = {};
            setTimeout(() => {
                try {
                    let doc = el.contentDocument;
                    size = {
                        width: doc.body.offsetWidth,
                        height: doc.body.offsetHeight
                    };
                }
                catch (err) {}
                this.$emit('loaded', e, size);

                if (this.autoWidth) {
                    el.style.width = (size.width + 'px') || '400px';
                }
                if (this.autoHeight) {
                    el.style.height = (size.height + 17 + 'px') || '400px';
                }
            }, this.autoSizeDelay);
        },
        setContentHtml(html) {
            try {
                let doc = this.$refs.iframe.contentDocument;
                doc.open();
                doc.write(html);
                // TODO: fix ie9
                doc.close();
            }
            catch (e) {
                if (document.frames) {
                    // ie9
                    document.frames[this.name].document.body.innerHTML = html;
                }
                else {
                    this.$refs.iframe.src = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
                }
            }
            this.loadHandler({target: this.$refs.iframe});
        },
        callContentMethod(...args) {
            let [methodName, ...restArgs] = args;

            if (!this.contentWindow) {
                throw new Error('No content window on this iframe');
            }

            if (!isFunction(this.contentWindow[methodName])) {
                throw new Error(`No "${methodName}" method on window`);
            }

            return this.contentWindow[methodName].apply(this.contentWindow, restArgs);
        },
        postMessage(message, targetOrigin) {
            if (!this.contentWindow) {
                throw new Error('No content window on this iframe');
            }

            this.contentWindow.postMessage(message, targetOrigin);
        }
    }
};
</script>

<style lang="less">
@import '~veui-theme-one/variables.less';

.ria-iframe {
    border: none;
}
</style>
