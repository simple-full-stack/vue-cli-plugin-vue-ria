<template>
    <base-view class="form-view">
        <slot name="before"></slot>
        <slot></slot>
        <veui-form
            ref="form"
            v-bind="store.formSetting"
            :data="store.formData"
            @submit="handleSubmit"
            @invalid="handleInvalid"
        >
            <slot name="field"></slot>
            <div class="form-operation" v-if="$slots.operation">
                <slot name="operation"></slot>
            </div>
        </veui-form>
        <slot name="after"></slot>
    </base-view>
</template>

<script>
import {Form} from 'veui';
import BaseView from './BaseView';
import FormModel from './FormModel';
import {each, get} from 'lodash';
import createView from './createView';

export default createView(BaseView, FormModel, {
    name: 'form-view',
    components: {
        BaseView,
        'veui-form': Form
    },
    created() {
        this.store.initFormData();
    },
    methods: {
        submit() {
            this.$refs.form.submit();
        },
        async handleSubmit(data) {
            try {
                this.handleSuccess(await this.store.submit());
            }
            catch (error) {
                this.handleError(error);
            }
        },
        handleInvalid(...args) {
            this.store.invalid(...args);
            this.$emit('invalid', ...args);
        },
        handleSuccess(res) {
            this.store.successToast && this.showToast(this.store.successToast, {type: 'success'});
            this.$refs.form.fields.forEach(field => field.hideValidity());
            this.store.success(res);
            this.$emit('submitsuccess', res);
        },
        handleError(err) {
            this.store.failToast && this.showToast(this.store.failToast, {type: 'error'});
            // 处理一下 fieldsError
            let fields = err.fields || err.field;
            if (fields) {
                each(fields, (message, name) => {
                    let target = get(this, `$refs.form.fieldsMap['${name}']`);
                    target && target.validities.unshift({
                        valid: false,
                        message,
                        fields: 'backend:field'
                    });
                });
            }
            this.store.fail(err);
            this.$emit('submitfail', err);
        }
    }
});
</script>

<style lang="less">
@import '../assets/css/variables';

.form-operation {
    margin-left: @ria-form-label-width;
    margin-top: 60px;

    .veui-button {
        margin-right: 20px;
    }

    &:empty {
        margin-top: 0;
    }
}
</style>
