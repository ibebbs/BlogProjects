/// <reference path="../Interfaces.d.ts" />
export default class ValueBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void;
    configure(options: any): void;
    priority: number;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
}
/**
 * For certain elements such as select and input type=radio we store
 * the real element value in NodeState if it is anything other than a
 * string. This method returns that value.
 * @param {Node} node
 * @param {IDomManager} domManager
 */
export declare function getNodeValue(node: Node, domManager: wx.IDomManager): any;
/**
 * Associate a value with an element. Either by using its value-attribute
 * or storing it in NodeState
 * @param {Node} node
 * @param {any} value
 * @param {IDomManager} domManager
 */
export declare function setNodeValue(node: Node, value: any, domManager: wx.IDomManager): void;
