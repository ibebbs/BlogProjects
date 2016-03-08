/// <reference path="../Interfaces.d.ts" />
export default class TextInputBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void;
    configure(options: any): void;
    priority: number;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
    protected getTextInputEventObservables(el: HTMLInputElement, isTextArea: boolean): Array<Rx.Observable<Object>>;
}
