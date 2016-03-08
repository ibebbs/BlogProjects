/// <reference path="../Interfaces.d.ts" />
/**
* The heart of WebRx's binding-system
* @class
*/
export declare class DomManager implements wx.IDomManager {
    constructor(compiler: wx.IExpressionCompiler, app: wx.IWebRxApp);
    applyBindings(model: any, rootNode: Node): void;
    applyBindingsToDescendants(ctx: wx.IDataContext, node: Node): void;
    cleanNode(rootNode: Node): void;
    cleanDescendants(node: Node): void;
    getObjectLiteralTokens(value: string): Array<wx.IObjectLiteralToken>;
    compileBindingOptions(value: string, module: wx.IModule): Object;
    getModuleContext(node: Node): wx.IModule;
    registerDataContextExtension(extension: (node: Node, ctx: wx.IDataContext) => void): void;
    getDataContext(node: Node): wx.IDataContext;
    createNodeState(model?: any, module?: any): wx.INodeState;
    isNodeBound(node: Node): boolean;
    setNodeState(node: Node, state: wx.INodeState): void;
    getNodeState(node: Node): wx.INodeState;
    clearNodeState(node: Node): void;
    evaluateExpression(exp: wx.ICompiledExpression, ctx: wx.IDataContext): any;
    expressionToObservable(exp: wx.ICompiledExpression, ctx: wx.IDataContext, evalObs?: Rx.Observer<any>): Rx.Observable<any>;
    private static bindingAttributeName;
    private static paramsAttributename;
    private nodeState;
    private expressionCache;
    private compiler;
    private dataContextExtensions;
    private app;
    private parserOptions;
    private applyBindingsInternal(ctx, el, module);
    private isObjectLiteralString(str);
    getBindingDefinitions(node: Node): Array<{
        key: string;
        value: string;
    }>;
    private applyBindingsRecursive(ctx, el, module?);
    private cleanNodeRecursive(node);
    private createLocals(captured, ctx);
}
/**
* Applies bindings to the specified node and all of its children using the specified data context.
* @param {any} model The model to bind to
* @param {Node} rootNode The node to be bound
*/
export declare function applyBindings(model: any, node?: Node): void;
/**
* Removes and cleans up any binding-related state from the specified node and its descendants.
* @param {Node} rootNode The node to be cleaned
*/
export declare function cleanNode(node: Node): void;
