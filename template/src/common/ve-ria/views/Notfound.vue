<template>
    <div class="not-found-view error-view">
        <div class="error-view-img error-view-404"></div>
        <h3>抱歉，访问的页面不存在！</h3>
        <a href="#/" class="error-view-button error-view-home">
            <veui-icon name="home"></veui-icon>首页
        </a>
        <a class="error-view-button error-view-back" @click="$router.back()">
            <veui-icon name="caret-left"></veui-icon>返回
        </a>
    </div>
</template>

<script>
import {Icon, Button} from 'veui';
import 'vue-awesome/icons/home';
import 'vue-awesome/icons/caret-left';

export default {
    name: 'Notfound',
    components: {
        'veui-button': Button,
        'veui-icon': Icon
    }
};
</script>
