<template>
    <div class="lego-sdk"></div>
</template>

<script>
import LegoSdk from '@baidu/lego-sdk/dist/lego-sdk';
import {isEqual, debounce, isNull, isUndefined} from 'lodash';
import input from 'veui/mixins/input';

export default {
    name: 'lego-sdk',
    mixins: [input],
    props: {
        value: null,

        /**
         * 物料编辑预览控件
         *
         * @param  {HTMLElement} dom  legoSdk展现容器
         * @param  {Object} template  模版相关信息，包括spec、renderjs等信息
         * @param  {Object} options 选项
         *     @param {boolean} options.hideEform 是否隐藏表单区域，默认false
         *     @param {boolean} options.hidePreview 是否隐藏预览区域，默认false
         *     @param {Array.<Object>} options.extraTabs 额外TAB
         *     @param {number} options.previewTabIndex 预览面板在所有TAB面板中的索引位置，默认0
         *     @param {number} options.activeTabIndex 初始展示的面板在所有TAB面板中的索引位置
         *     @param {string} options.tips 预览区域下方的提示文字
         *
         *     @param {Object} options.defaultValue 默认数据
         *     @param {Object} options.uploadUrl 上传路径
         *     @param {number} options.isSupportDWZ 是否支持短网址，默认为true
         *
         *     @param {boolean} options.rewriteLinkTarget 是否重写预览里的a链接的target
         *     @param {boolean} options.fixedHeightCanvas 表单预览区域高度用给定的值
         *     @param {string} options.baseCssUrl 基础css文件url
         *     @param {string} options.previewBeforeCode 定制预览代码（head里）
         *     @param {string} options.previewAfterCode 定制预览代码（最后面）
         *     @param {Array|undefined} options.pplBlockNames 个性化blockName
         *     @param {Array|undefined} options.previewPlugins 定制预览插件名array
         */
        template: null,
        options: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    mounted() {
        this.createLego();
    },
    watch: {
        value(v, oldV) {
            if (!isEqual(v, this.lego.getValue())) {
                this.lego.setValue(v);
            }
        },
        template() {
            this.lego.dispose();
            this.createLego();
        },
        options() {
            this.lego.dispose();
            this.createLego();
        }
    },
    beforeDestroy() {
        if (this.lego) {
            this.lego.dispose();
        }
    },
    methods: {
        validate() {
            return this.lego.validate();
        },
        createLego() {
            this.$el.innerHTML = '';

            let container = document.createElement('div');
            this.$el.appendChild(container);

            if (this.template && this.template.previewFlags) {
                this.options.previewPlugins = this.template.previewFlags;
            }

            // defaultValue 是直接透传给 LegoSdk 的，所以可以认为优先级比 value 高
            // 但是如果 v-model 的值存在而且没有设置 defaultValue，就同步一下
            if (!isNull(this.value) && isUndefined(this.options.defaultValue)) {
                this.options.defaultValue = this.value;
            }
            this.lego = new LegoSdk(container, this.template, this.options);
            this.form = this.lego.form;

            // 不然就在这里用 defaultValue 把 value 覆盖掉
            this.$emit('input', this.lego.getValue());
            this.form.addListener('formChange', debounce(() => {
                let newValue = this.lego.getValue();
                if (!isEqual(this.value, newValue)) {
                    this.$emit('input', this.lego.getValue());
                }
            }, 100));

            this.$emit('load', this.lego, this.form);
        }
    }
};
</script>

<style lang="less">
.lego-sdk * {
    box-sizing: content-box;
}
</style>
