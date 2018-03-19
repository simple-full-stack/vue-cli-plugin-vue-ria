<template>
    <div class="forbidden-view error-view">
        <div class="error-view-img error-view-403"></div>
        <h3>抱歉，出错啦！</h3>
        <p>可能原因：该用户无权限访问当前页面或用户被禁用</p>
        <a href="#/" class="error-view-button error-view-home"><veui-icon name="home"></veui-icon>首页</a>
        <a class="error-view-button error-view-back" @click="$router.back()">
            <veui-icon name="caret-left"></veui-icon>返回
        </a>
    </div>
</template>

<script>
import {Icon} from 'veui';

export default {
    name: 'Forbidden',
    components: {
        'veui-icon': Icon
    }
};
</script>
