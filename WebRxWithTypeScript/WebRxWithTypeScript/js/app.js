/// <reference path="../Scripts/rx.all.d.ts"/>
/// <reference path="../Scripts/typings/web.rx.d.ts" />
wx.app.component('hello', {
    viewModel: function () {
        this.firstName = 'Bart';
        this.lastName = 'Simpson';
    },
    template: 'The name is <span data-bind="text: firstName + \' \' + lastName"></span>'
});
wx.router.state({
    name: "$",
    views: { 'main': "hello" }
});
wx.router.reload();
wx.applyBindings({});
//# sourceMappingURL=app.js.map