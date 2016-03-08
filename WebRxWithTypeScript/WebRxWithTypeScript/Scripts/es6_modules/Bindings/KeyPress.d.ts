/// <reference path="../Interfaces.d.ts" />
export default class KeyPressBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void;
    configure(options: any): void;
    priority: number;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
    private testCombination(combination, event);
    private testCombinations(combinations, event);
    private wireKey(value, obs, combinations, ctx, state, module);
}
