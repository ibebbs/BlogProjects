/// <reference path="../Interfaces.d.ts" />
export default class ModuleBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void;
    configure(options: any): void;
    priority: number;
    controlsDescendants: boolean;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
    protected applyValue(el: HTMLElement, module: wx.IModule, template: Array<Node>, ctx: wx.IDataContext, state: wx.INodeState, initialApply: boolean): void;
}
