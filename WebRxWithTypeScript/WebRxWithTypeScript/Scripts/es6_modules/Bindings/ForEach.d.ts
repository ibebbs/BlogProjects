/// <reference path="../../../../src/RxExtensions.d.ts" />
import VirtualChildNodes from "./../Core/VirtualChildNodes";
export default class ForEachBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void;
    configure(options: any): void;
    priority: number;
    controlsDescendants: boolean;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
    protected createIndexPropertyForNode(proxy: VirtualChildNodes, child: Node, startIndex: number, trigger: Rx.Observable<any>, templateLength: number): wx.IObservableProperty<number>;
    protected appendAllRows(proxy: VirtualChildNodes, list: wx.IObservableList<any>, ctx: wx.IDataContext, template: Array<Node>, hooks: wx.IForEachBindingHooks, animations: wx.IForeachAnimationDescriptor, indexTrigger: Rx.Subject<any>, isInitial: boolean): void;
    protected appendRow(proxy: VirtualChildNodes, index: number, item: any, ctx: wx.IDataContext, template: Array<Node>, hooks: wx.IForEachBindingHooks, animations: wx.IForeachAnimationDescriptor, indexTrigger?: Rx.Subject<any>, isInitial?: boolean): void;
    protected insertRow(proxy: VirtualChildNodes, index: number, item: any, ctx: wx.IDataContext, template: Array<Node>, hooks: wx.IForEachBindingHooks, animations: wx.IForeachAnimationDescriptor, indexTrigger: Rx.Subject<any>): void;
    protected removeRow(proxy: VirtualChildNodes, index: number, item: any, template: Array<Node>, hooks: wx.IForEachBindingHooks, animations: wx.IForeachAnimationDescriptor): void;
    protected moveRow(proxy: VirtualChildNodes, from: number, to: number, item: any, template: Array<Node>, hooks: wx.IForEachBindingHooks, animations: wx.IForeachAnimationDescriptor, indexTrigger: Rx.Subject<any>): void;
    protected rebindRow(proxy: VirtualChildNodes, index: number, item: any, template: Array<Node>, indexTrigger: Rx.Subject<any>): void;
    protected observeList(proxy: VirtualChildNodes, ctx: wx.IDataContext, template: Array<Node>, cleanup: Rx.CompositeDisposable, list: wx.IObservableList<any>, hooks: wx.IForEachBindingHooks, animations: wx.IForeachAnimationDescriptor, indexTrigger: Rx.Subject<any>): void;
    protected applyValue(el: HTMLElement, value: any, hooks: wx.IForEachBindingHooks, animations: wx.IForeachAnimationDescriptor, template: Array<Node>, ctx: wx.IDataContext, initialApply: boolean, cleanup: Rx.CompositeDisposable, setProxyFunc: (VirtualChildNodes) => void): void;
}
