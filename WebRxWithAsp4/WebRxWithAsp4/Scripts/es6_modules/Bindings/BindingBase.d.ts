/// <reference path="../Interfaces.d.ts" />
/**
* Base class for one-way bindings that take a single expression and apply the result to one or more target elements
* @class
*/
export declare class SingleOneWayBindingBase implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void;
    configure(options: any): void;
    priority: number;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
    protected applyValue(el: HTMLElement, value: any): void;
}
/**
* Base class for one-way bindings that take multiple expressions defined as object literal and apply the result to one or more target elements
* @class
*/
export declare class MultiOneWayBindingBase implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp, supportsDynamicValues?: boolean);
    applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void;
    configure(options: any): void;
    priority: number;
    protected supportsDynamicValues: boolean;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
    private subscribe(el, obs, key, state);
    protected applyValue(el: HTMLElement, key: string, value: any): void;
}
