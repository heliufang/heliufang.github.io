/*页面载入完成后，创建复制按钮   https://www.jianshu.com/p/3e9d614c1e77 
    https://clipboardjs.com/dist/clipboard.min.js
*/
!function (e, t, a) {
    /* code */
    var initCopyCode = function () {
        var copyHtml = '<div title="复制代码" class="btn-copy layui-icon layui-icon-file-b" data-clipboard-snippet=""></div>';
        $("pre").prepend(copyHtml);
        new ClipboardJS('.btn-copy', {
            target: function (trigger) {
                console.log('ClipboardJS', trigger)
                var html = `<div id="successInfo"><i class="layui-icon layui-icon-ok-circle"></i> 复制成功</div>`
                $("body").prepend(html)
                console.log('$("body")', $("body"))
                setTimeout(function () {
                    $("#successInfo").remove()
                }, 3000)
                return trigger.nextElementSibling;
            }
        });
    }
    initCopyCode();
}(window, document);