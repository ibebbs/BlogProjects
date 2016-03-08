/// <reference path="../Interfaces.d.ts" />
/**
* Base class for simple-bindings. Responsible for taking care of the heavy-lifting.
* @class
*/
export default class SimpleBinding implements wx.IBindingHandler, wx.ISimpleBinding {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void;
    configure(options: any): void;
    inner: wx.ISimpleBindingHandler;
    priority: number;
    controlsDescendants: boolean;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
}
