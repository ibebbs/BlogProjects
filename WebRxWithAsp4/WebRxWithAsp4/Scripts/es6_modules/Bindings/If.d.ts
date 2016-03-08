/// <reference path="../Interfaces.d.ts" />
export declare class IfBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void;
    configure(options: any): void;
    priority: number;
    controlsDescendants: boolean;
    protected inverse: boolean;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
    protected applyValue(el: HTMLElement, value: any, template: Array<Node>, ctx: wx.IDataContext, animations: wx.IIfAnimationDescriptor, initialApply: boolean): Rx.IDisposable;
}
export declare class NotIfBinding extends IfBinding {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
}
