/// <reference path="../../Interfaces.d.ts" />
export default class ViewBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, router: wx.IRouter, app: wx.IWebRxApp);
    applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void;
    configure(options: any): void;
    priority: number;
    controlsDescendants: boolean;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
    protected router: wx.IRouter;
    protected applyTemplate(viewName: string, componentName: string, previousComponentName: string, componentParams: Object, animations: wx.IViewAnimationDescriptor, el: HTMLElement, ctx: wx.IDataContext, module: wx.IModule): Rx.IDisposable;
}
