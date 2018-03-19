/**
 * @file 封装window.location和window.history部分操作
 * @author Justineo
 */

export class Location {

    /**
     * window.location.assign
     *
     * @param {string} url 跳转URL
     */
    assign(url) {
        window.location.assign(url);
    }

    /**
     * assign 的别名
     *
     * @param {string} url 跳转URL
     */
    redirect = location.assign;

    /**
     * window.location.replace
     *
     * @param {string} url 跳转URL
     */
    replace(url) {
        window.location.replace(url);
    }

    /**
     * window.location.reload
     *
     * @param {boolean} isForce 是否强制刷新
     */
    reload(isForce) {
        window.location.reload(isForce);
    }

    /**
     * window.history.back
     */
    back() {
        window.history.back();
    }

    /**
     * window.history.forward
     */
    forward() {
        window.history.forward();
    }

    /**
     * window.history.go
     *
     * @param {boolean} step 前进/后退步数
     */
    go(step) {
        window.history.go(step);
    }
}

export default new Location();
