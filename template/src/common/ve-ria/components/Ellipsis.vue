<template>
    <div ref="main" :class="classList" class="ria-ellipsis" :ui="ui">
        <div class="ria-ellipsis-container" ref="container" v-if="mode === 'rows'">
            <template v-if="text">{{ text }}</template>
            <slot v-else></slot>
        </div>
        <span v-else
            ref="text"
            :class="isOverflow ? 'ria-ellipsis-text-overflow' : ''"
            :style="{width: textWidth,
                display: textDisplay}">{{ text }}</span>
        <veui-tooltip v-if="isOverflow"
            target="main"
            position="bottom right"
            overlay-class="ria-ellipsis-tooltip">
            <slot name="tooltip"></slot>
            <template v-if="!$slots.tooltip" >
                <template v-if="text">{{ text }}</template>
                <div v-else v-html="slotContent"></div>
            </template>
        </veui-tooltip>
    </div>
</template>

<script>
import {includes, isNumber, isNaN} from 'lodash';
import {Tooltip} from 'veui';

export default {
    components: {
        VeuiTooltip: Tooltip
    },
    props: {
        // 如果mode是rows，则此参数指明显示多少行
        limit: {
            type: Number
        },

        // mode是chars时，通过width指定宽度
        width: {
            type: [Number, String]
        },

        // 处理的方式：
        // 1、rows，代表超过多少行就显示省略号
        // 2、chars，代表超过多少个字符就显示省略号
        mode: {
            type: String,
            validator(value) {
                return includes(['rows', 'chars'], value);
            },
            default: 'chars'
        },

        // 当mode为chars时，通过text prop传入文本内容
        text: String,
        ui: String
    },
    data() {
        return {
            isOverflow: false,
            textDisplay: 'inline'
        };
    },
    computed: {
        classList() {
            if (this.mode === 'rows') {
                const classList = [];
                if (this.isOverflow) {
                    classList.push('ria-ellipsis-multiline-overflow');
                }
                classList.push('mode-rows');
                return classList;
            }
            if (this.mode === 'chars') {
                return ['mode-chars'];
            }
            return [];
        },
        slotContent() {
            return this.$slots.default ? this.$refs.container.innerHTML : '';
        },
        textWidth() {
            return isNumber(this.width) || !isNaN(+this.width)
                ? `${this.width}px`
                : this.width;
        }
    },
    mounted() {
        if (this.mode === 'chars') {
            this.refreshChars();
        }

        if (this.mode === 'rows') {
            this.refreshRows();
        }

        if (this.$slots.tooltip) {
            this.isOverflow = true;
        }
    },
    watch: {
        text(value) {
            if (this.mode === 'chars') {
                this.refreshChars();
            }
        }
    },
    updated() {
        if (this.mode === 'rows') {
            this.refreshRows();
        }
    },
    methods: {
        refreshChars() {
            if (this.$slots.tooltip) {
                return;
            }

            this.textDisplay = 'inline';
            this.$nextTick(() => {
                let initialWidth = this.$refs.text.offsetWidth;

                this.textDisplay = 'inline-block';
                this.$nextTick(() => {
                    let targetWidth = this.$refs.text.offsetWidth;
                    this.isOverflow = initialWidth > targetWidth;
                    if (!this.isOverflow) {
                        this.textDisplay = 'inline';
                    }
                });
            });
        },
        refreshRows() {
            if (this.$slots.tooltip) {
                return;
            }

            let computedStyle = getComputedStyle(this.$refs.container);
            let lineHeight = parseFloat(computedStyle.lineHeight);
            if (isNaN(lineHeight)) {
                lineHeight = parseFloat(computedStyle.fontSize) * 1.2;
            }
            let limitedHeight = this.limit * lineHeight;

            this.$nextTick(() => {
                this.isOverflow = parseFloat(this.$refs.container.offsetHeight) > limitedHeight;
                if (this.isOverflow) {
                    this.$refs.main.style.height = `${Math.floor(limitedHeight)}px`;
                }
            });
        }
    }
};
</script>

<style lang="less">
@import "../assets/css/lib.less";

.ria-ellipsis {
    line-height: 1.2;

    &-container {
        display: inline-block;
        word-break: break-all;
        white-space: normal;
    }

    &.mode-chars {
        display: inline;
        white-space: nowrap;
    }

    &.mode-rows {
        display: inline-block;
    }

    &-tooltip {
        max-width: 250px;
    }

    &[ui~="aux"] {
        margin: 0;
        font-size: 12px;
        color: @veui-gray-color-3;
    }

    &-text-overflow {
        text-overflow: ellipsis;
        overflow: hidden;
        vertical-align: middle;
    }

    &-multiline-overflow {
        position: relative;
        overflow: hidden;
        &::after {
            content: '...';
            position: absolute;
            background: #fff;
            bottom: 0;
            right: 0;
        }
    }
}
</style>
