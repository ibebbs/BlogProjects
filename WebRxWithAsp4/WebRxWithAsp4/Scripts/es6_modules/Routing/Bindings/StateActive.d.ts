/// <reference path="../../Interfaces.d.ts" />
export default class StateActiveBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, router: wx.IRouter, app: wx.IWebRxApp);
    applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void;
    configure(options: any): void;
    priority: number;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
    protected router: wx.IRouter;
}
