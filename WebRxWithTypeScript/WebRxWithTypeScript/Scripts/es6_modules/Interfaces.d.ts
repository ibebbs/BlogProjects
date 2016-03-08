/// <reference path="../../../node_modules/rx/ts/rx.all.d.ts" />
declare module wx {
    type ObservableOrProperty<T> = Rx.Observable<T> | IObservableProperty<T>;
    /**
    * IUnknown
    * @interface
    **/
    interface IUnknown {
        queryInterface(iid: string): boolean;
    }
    /**
    * Dependency Injector and service locator
    * @interface
    **/
    interface IInjector {
        register(key: string, factory: Array<any>, singleton?: boolean): IInjector;
        register(key: string, factory: () => any, singleton?: boolean): IInjector;
        register(key: string, instance: any): IInjector;
        get<T>(key: string, args?: any): T;
        resolve<T>(iaa: Array<any>, args?: any): T;
    }
    /**
    * The WeakMap object is a collection of key/value pairs in which the keys are objects and the values can be arbitrary values. The keys are held using weak references.
    * @interface
    **/
    interface IWeakMap<TKey extends Object, T> {
        set(key: TKey, value: T): void;
        get(key: TKey): T;
        has(key: TKey): boolean;
        delete(key: TKey): void;
        isEmulated: boolean;
    }
    /**
    * The Set object lets you store unique values of any type, whether primitive values or object references.
    * @interface
    **/
    interface ISet<T> {
        add(value: T): ISet<T>;
        has(key: T): boolean;
        delete(key: T): boolean;
        clear(): void;
        forEach(callback: (item: T) => void, thisArg?: any): void;
        size: number;
        isEmulated: boolean;
    }
    /**
    * The Map object is a simple key/value map. Any value (both objects and primitive values) may be used as either a key or a value.
    * @interface
    **/
    interface IMap<TKey extends Object, T> {
        set(key: TKey, value: T): void;
        get(key: TKey): T;
        has(key: TKey): boolean;
        delete(key: TKey): void;
        clear(): void;
        forEach(callback: (value: T, key: TKey, map: IMap<TKey, T>) => void, thisArg?: any): void;
        size: number;
        isEmulated: boolean;
    }
    /**
    * IObservableProperty combines a function signature for value setting and getting with
    * observables for monitoring value changes
    * @interface
    **/
    interface IObservableProperty<T> extends Rx.IDisposable {
        (newValue: T): void;
        (): T;
        changing: Rx.Observable<T>;
        changed: Rx.Observable<T>;
    }
    /**
    * IObservableReadOnlyProperty provides observable source and thrownExceptions
    * members with the standard observable property base members
    * @interface
    **/
    interface IObservableReadOnlyProperty<T> extends IObservableProperty<T> {
        source: Rx.Observable<T>;
        thrownExceptions: Rx.Observable<Error>;
        catchExceptions(onError: (error: Error) => void): IObservableReadOnlyProperty<T>;
    }
    interface IRangeInfo {
        from: number;
        to?: number;
    }
    /**
    * Provides information about a changed property value on an object
    * @interface
    **/
    interface IPropertyChangedEventArgs {
        sender: any;
        propertyName: string;
    }
    /**
    * Encapsulates change notifications published by various IObservableList members
    * @interface
    **/
    interface IListChangeInfo<T> extends IRangeInfo {
        items: T[];
    }
    /**
    * INotifyListItemChanged provides notifications for collection item updates, ie when an object in
    * a list changes.
    * @interface
    **/
    interface INotifyListItemChanged {
        /**
        * Provides Item Changing notifications for any item in collection that
        * implements IReactiveNotifyPropertyChanged. This is only enabled when
        * ChangeTrackingEnabled is set to True.
        **/
        itemChanging: Rx.Observable<IPropertyChangedEventArgs>;
        /**
        * Provides Item Changed notifications for any item in collection that
        * implements IReactiveNotifyPropertyChanged. This is only enabled when
        * ChangeTrackingEnabled is set to True.
        **/
        itemChanged: Rx.Observable<IPropertyChangedEventArgs>;
        /**
        * Enables the ItemChanging and ItemChanged properties; when this is
        * enabled, whenever a property on any object implementing
        * IReactiveNotifyPropertyChanged changes, the change will be
        * rebroadcast through ItemChanging/ItemChanged.
        **/
        changeTrackingEnabled: boolean;
    }
    /**
    * INotifyListChanged of T provides notifications when the contents
    * of a list are changed (items are added/removed/moved).
    * @interface
    **/
    interface INotifyListChanged<T> {
        /**
        * This Observable fires before the list is changing, regardless of reason
        **/
        listChanging: Rx.Observable<boolean>;
        /**
        * This Observable fires after list has changed, regardless of reason
        **/
        listChanged: Rx.Observable<boolean>;
        /**
        * Fires when items are added to the list, once per item added.
        * Functions that add multiple items such addRange should fire this
        * multiple times. The object provided is the item that was added.
        **/
        itemsAdded: Rx.Observable<IListChangeInfo<T>>;
        /**
        * Fires before an item is going to be added to the list.
        **/
        beforeItemsAdded: Rx.Observable<IListChangeInfo<T>>;
        /**
        * Fires once an item has been removed from a list, providing the
        * item that was removed.
        **/
        itemsRemoved: Rx.Observable<IListChangeInfo<T>>;
        /**
        * Fires before an item will be removed from a list, providing
        * the item that will be removed.
        **/
        beforeItemsRemoved: Rx.Observable<IListChangeInfo<T>>;
        /**
        * Fires before an items moves from one position in the list to
        * another, providing the item(s) to be moved as well as source and destination
        * indices.
        **/
        beforeItemsMoved: Rx.Observable<IListChangeInfo<T>>;
        /**
        * Fires once one or more items moves from one position in the list to
        * another, providing the item(s) that was moved as well as source and destination
        * indices.
        **/
        itemsMoved: Rx.Observable<IListChangeInfo<T>>;
        /**
        * Fires before an item is replaced indices.
        **/
        beforeItemReplaced: Rx.Observable<IListChangeInfo<T>>;
        /**
        * Fires after an item is replaced
        **/
        itemReplaced: Rx.Observable<IListChangeInfo<T>>;
        /**
        * Fires when the list length changes, regardless of reason
        **/
        lengthChanging: Rx.Observable<number>;
        /**
        * Fires when the list length changes, regardless of reason
        **/
        lengthChanged: Rx.Observable<number>;
        /**
        * Fires when the empty state changes, regardless of reason
        **/
        isEmptyChanged: Rx.Observable<boolean>;
        /**
        * This Observable is fired when a shouldReset fires on the list. This
        * means that you should forget your previous knowledge of the state
        * of the collection and reread it.
        *
        * This does *not* mean Clear, and if you interpret it as such, you are
        * Doing It Wrong.
        **/
        shouldReset: Rx.Observable<any>;
        /**
        * Suppresses change notification from the list until the disposable returned by this method is disposed
        **/
        suppressChangeNotifications(): Rx.IDisposable;
    }
    /**
    /* Represents a read-only collection of objects that can be individually accessed by index.
    /* @interface
    **/
    interface IList<T> {
        length: IObservableProperty<number>;
        get(index: number): T;
        toArray(): Array<T>;
        isReadOnly: boolean;
    }
    /**
    /* Represents an observable read-only collection of objects that can be individually accessed by index.
    /* @interface
    **/
    interface IObservableReadOnlyList<T> extends IList<T>, INotifyListChanged<T> {
        isEmpty: IObservableProperty<boolean>;
        contains(item: T): boolean;
        indexOf(item: T): number;
        forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
        map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
        filter(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): T[];
        every(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean;
        some(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean;
    }
    /**
    /* Represents an observable read-only collection which can be projected and paged
    /* @interface
    **/
    interface IProjectableObservableReadOnlyList<T> extends IObservableReadOnlyList<T>, INotifyListItemChanged {
        /**
        /* Creates a live-projection of itself that can be filtered, re-ordered and mapped.
        /* @param filter {(item: T) => boolean} A filter to determine whether to exclude items in the derived collection
        /* @param orderer {(a: TNew, b: TNew) => number} A comparator method to determine the ordering of the resulting collection
        /* @param selector {(T) => TNew} A function that will be run on each item to project it to a different type
        /* @param refreshTrigger {Rx.Observable<TDontCare>} When this Observable is signalled, the derived collection will be manually reordered/refiltered.
        **/
        project<TNew, TDontCare>(filter?: (item: T) => boolean, orderer?: (a: TNew, b: TNew) => number, selector?: (item: T) => TNew, refreshTrigger?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): IProjectableObservableReadOnlyList<TNew>;
        /**
        /* Creates a live-projection of itself that can be filtered, re-ordered and mapped.
        /* @param filter {(item: T) => boolean} A filter to determine whether to exclude items in the derived collection
        /* @param orderer {(a: TNew, b: TNew) => number} A comparator method to determine the ordering of the resulting collection
        /* @param refreshTrigger {Rx.Observable<TDontCare>} When this Observable is signalled, the derived collection will be manually reordered/refiltered.
        **/
        project<TDontCare>(filter?: (item: T) => boolean, orderer?: (a: T, b: T) => number, refreshTrigger?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): IProjectableObservableReadOnlyList<T>;
        /**
        /* Creates a live-projection of itself that can be filtered, re-ordered and mapped.
        /* @param filter {(item: T) => boolean} A filter to determine whether to exclude items in the derived collection
        /* @param refreshTrigger {Rx.Observable<TDontCare>} When this Observable is signalled, the derived collection will be manually reordered/refiltered.
        **/
        project<TDontCare>(filter?: (item: T) => boolean, refreshTrigger?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): IProjectableObservableReadOnlyList<T>;
        /**
        /* Creates a live-projection of itself that can be filtered, re-ordered and mapped.
        /* @param refreshTrigger {Rx.Observable<TDontCare>} When this Observable is signalled, the derived collection will be manually reordered/refiltered.
        **/
        project<TDontCare>(refreshTrigger?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): IProjectableObservableReadOnlyList<T>;
        /**
        * Creates a paged live-projection of itself.
        * @param pageSize {number} Initial page-size of the projection
        * @param currentPage {number} Current page of the projection
        **/
        page(pageSize: number, currentPage?: number, scheduler?: Rx.IScheduler): IPagedObservableReadOnlyList<T>;
    }
    /**
    * IObservablePagedReadOnlyList represents a virtual paging projection over an existing observable list
    * @interface
    **/
    interface IPagedObservableReadOnlyList<T> extends IObservableReadOnlyList<T> {
        source: IObservableReadOnlyList<T>;
        pageSize: IObservableProperty<number>;
        currentPage: IObservableProperty<number>;
        pageCount: IObservableProperty<number>;
    }
    /**
    * IObservableList of T represents a list that can notify when its
    * contents are changed (either items are added/removed, or the object
    * itself changes).
    * @interface
    **/
    interface IObservableList<T> extends IProjectableObservableReadOnlyList<T> {
        set(index: number, item: T): any;
        add(item: T): void;
        push(item: T): void;
        clear(): void;
        remove(item: T): boolean;
        insert(index: number, item: T): void;
        removeAt(index: number): void;
        addRange(collection: Array<T>): void;
        insertRange(index: number, collection: Array<T>): void;
        move(oldIndex: any, newIndex: any): void;
        removeAll(itemsOrSelector: Array<T> | ((item: T) => boolean)): Array<T>;
        removeRange(index: number, count: number): void;
        reset(contents?: Array<T>): void;
        sort(comparison: (a: T, b: T) => number): void;
    }
    /**
    * This interface is implemented by RxUI objects which are given
    * IObservables as input - when the input IObservables OnError, instead of
    * disabling the RxUI object, we catch the Rx.Observable and pipe it into
    * this property.
    *
    * Normally this Rx.Observable is implemented with a ScheduledSubject whose
    * default Observer is wx.app.defaultExceptionHandler - this means, that if
    * you aren't listening to thrownExceptions and one appears, the exception
    * will appear on the UI thread and crash the application.
    * @interface
    **/
    interface IHandleObservableErrors {
        /**
        * Fires whenever an exception would normally terminate the app
        * internal state.
        **/
        thrownExceptions: Rx.Observable<Error>;
    }
    /**
    * ICommand represents an ICommand which also notifies when it is
    * executed (i.e. when Execute is called) via IObservable. Conceptually,
    * this represents an Event, so as a result this IObservable should never
    * onComplete or onError.
    * @interface
    **/
    interface ICommand<T> extends Rx.IDisposable, IHandleObservableErrors {
        canExecute(parameter: any): boolean;
        execute(parameter: any): void;
        /**
        * Gets a value indicating whether this instance can execute observable.
        **/
        canExecuteObservable: Rx.Observable<boolean>;
        /**
        * Gets a value indicating whether this instance is executing. This
        * Observable is guaranteed to always return a value immediately (i.e.
        * it is backed by a BehaviorSubject), meaning it is safe to determine
        * the current state of the command via IsExecuting.First()
        **/
        isExecuting: Rx.Observable<boolean>;
        /**
        * Gets an observable that returns command invocation results
        **/
        results: Rx.Observable<T>;
        /**
        * Executes a Command and returns the result asynchronously. This method
        * makes it *much* easier to test Command, as well as create
        * Commands who invoke inferior commands and wait on their results.
        *
        * Note that you **must** Subscribe to the Observable returned by
        * ExecuteAsync or else nothing will happen (i.e. ExecuteAsync is lazy)
        *
        * Note also that the command will be executed, irrespective of the current value
        * of the command's canExecute observable.
        * @return An Observable representing a single invocation of the Command.
        * @param parameter Don't use this.
        **/
        executeAsync(parameter?: any): Rx.Observable<T>;
    }
    /**
    * Data context used in binding operations
    * @interface
    **/
    interface IDataContext {
        $data: any;
        $root: any;
        $parent: any;
        $parents: any[];
    }
    /**
    * Extensible Node state
    * @interface
    **/
    interface INodeState {
        cleanup: Rx.CompositeDisposable;
        isBound: boolean;
        model?: any;
        module?: any;
    }
    interface IObjectLiteralToken {
        key?: string;
        unknown?: string;
        value?: string;
    }
    interface IExpressionFilter {
        (...args: Array<any>): any;
    }
    interface IExpressionCompilerOptions {
        disallowFunctionCalls?: boolean;
        filters?: {
            [filterName: string]: IExpressionFilter;
        };
    }
    interface ICompiledExpression {
        (scope?: any, locals?: any): any;
        literal?: boolean;
        constant?: boolean;
        assign?: (self: any, value: any, locals: any) => any;
    }
    interface ICompiledExpressionRuntimeHooks {
        readFieldHook?: (o: any, field: any) => any;
        writeFieldHook?: (o: any, field: any, newValue: any) => any;
        readIndexHook?: (o: any, field: any) => any;
        writeIndexHook?: (o: any, field: any, newValue: any) => any;
    }
    interface IExpressionCompiler {
        compileExpression(src: string, options?: IExpressionCompilerOptions, cache?: {
            [exp: string]: ICompiledExpression;
        }): ICompiledExpression;
        getRuntimeHooks(locals: any): ICompiledExpressionRuntimeHooks;
        setRuntimeHooks(locals: any, hooks: ICompiledExpressionRuntimeHooks): void;
        parseObjectLiteral(objectLiteralString: any): Array<IObjectLiteralToken>;
    }
    interface IAnimation {
        prepare(element: Node | Array<Node> | HTMLElement | Array<HTMLElement> | NodeList, params?: any): void;
        run(element: Node | Array<Node> | HTMLElement | Array<HTMLElement> | NodeList, params?: any): Rx.Observable<any>;
        complete(element: Node | Array<Node> | HTMLElement | Array<HTMLElement> | NodeList, params?: any): void;
    }
    interface IAnimationCssClassInstruction {
        css: string;
        add: boolean;
        remove: boolean;
    }
    /**
    * The Dom Manager coordinates everything involving browser DOM-Manipulation
    * @interface
    **/
    interface IDomManager {
        /**
        * Applies bindings to the specified node and all of its children using the specified data context
        * @param {IDataContext} ctx The data context
        * @param {Node} rootNode The node to be bound
        **/
        applyBindings(model: any, rootNode: Node): void;
        /**
        * Applies bindings to all the children of the specified node but not the node itself using the specified data context.
        * You generally want to use this method if you are authoring a new binding handler that handles children.
        * @param {IDataContext} ctx The data context
        * @param {Node} rootNode The node to be bound
        **/
        applyBindingsToDescendants(ctx: IDataContext, rootNode: Node): void;
        /**
        * Removes and cleans up any binding-related state from the specified node and its descendants.
        * @param {Node} rootNode The node to be cleaned
        **/
        cleanNode(rootNode: Node): void;
        /**
        * Removes and cleans up any binding-related state from all the children of the specified node but not the node itself.
        * @param {Node} rootNode The node to be cleaned
        **/
        cleanDescendants(rootNode: Node): void;
        /**
        * Stores updated state for the specified node
        * @param {Node} node The target node
        * @param {IBindingState} state The updated node state
        **/
        setNodeState(node: Node, state: INodeState): void;
        /**
        * Computes the actual data context starting at the specified node
        * @param {Node} node The node to be bound
        * @return {IDataContext} The data context to evaluate the expression against
        **/
        getDataContext(node: Node): IDataContext;
        /**
        * Retrieves the current node state for the specified node
        * @param {Node} node The target node
        **/
        getNodeState(node: Node): INodeState;
        /**
        * Initializes a new node state
        * @param {any} model The model
        **/
        createNodeState(model?: any): INodeState;
        /**
        * Returns true if the node is currently bound by one or more binding-handlers
        * @param {Node} node The node to check
        **/
        isNodeBound(node: Node): boolean;
        /**
        * Removes any binding-related state from the specified node. Use with care! In most cases you would want to use cleanNode!
        * @param {Node} node The node to clear
        **/
        clearNodeState(node: Node): any;
        /**
        * Compiles a simple string expression or multiple expressions within an object-literal recursively into an expression tree
        * @param {string} value The expression(s) to compile
        **/
        compileBindingOptions(value: string, module: IModule): any;
        /**
        * Tokenizes an object-literal into an array of key-value pairs
        * @param {string} value The object literal tokenize
        **/
        getObjectLiteralTokens(value: string): Array<IObjectLiteralToken>;
        /**
        * Returns data-binding expressions for a DOM-Node
        * @param {Node} node The node
        **/
        getBindingDefinitions(node: Node): Array<{
            key: string;
            value: string;
        }>;
        /**
        * Registers hook that gets invoked whenever a new data-context gets assembled
        * @param {Node} node The node for which the data-context gets assembled
        * @param {IDataContext} ctx The current data-context
        **/
        registerDataContextExtension(extension: (node: Node, ctx: IDataContext) => void): any;
        /**
        * Evaluates an expression against a data-context and returns the result
        * @param {IExpressionFunc} exp The source expression
        * @param {IExpressionFunc} evalObs Allows monitoring of expression evaluation passes (for unit testing)
        * @param {IDataContext} The data context to evaluate the expression against
        * @return {any} A value representing the result of the expression-evaluation
        **/
        evaluateExpression(exp: ICompiledExpression, ctx: IDataContext): any;
        /**
        * Creates an observable that produces values representing the result of the expression.
        * If any observable input of the expression changes, the expression gets re-evaluated
        * and the observable produces a new value.
        * @param {IExpressionFunc} exp The source expression
        * @param {IExpressionFunc} evalObs Allows monitoring of expression evaluation passes (for unit testing)
        * @param {IDataContext} The data context to evaluate the expression against
        * @return {Rx.Observable<any>} A sequence of values representing the result of the last evaluation of the expression
        **/
        expressionToObservable(exp: ICompiledExpression, ctx: IDataContext, evalObs?: Rx.Observer<any>): Rx.Observable<any>;
    }
    /**
    * Bindings are markers on a DOM element (such as an attribute or comment) that tell
    * WebRx's DOM compiler to attach a specified behavior to that DOM element or even
    * transform the element and its children.
    * @interface
    **/
    interface IBindingHandler {
        /**
        * Applies the binding to the specified element
        * @param {Node} node The target node
        * @param {any} options The options for the handler
        * @param {IDataContext} ctx The curent data context
        * @param {IDomElementState} state State of the target element
        * @param {IModule} module The module bound to the current binding scope
        **/
        applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void;
        /**
        * Configures the handler using a handler-specific options object
        * @param {any} options The handler-specific options
        **/
        configure(options: any): void;
        /**
        * When there are multiple bindings defined on a single DOM element,
        * sometimes it is necessary to specify the order in which the bindings are applied.
        */
        priority: number;
        /**
        * If set to true then bindings won't be applied to children
        * of the element such binding is encountered on. Instead
        * the handler will be responsible for that.
        **/
        controlsDescendants?: boolean;
    }
    /**
    * Simplified binding-handler
    * @interface
    **/
    interface ISimpleBindingHandler {
        init?(el: HTMLElement, value: any, ctx: wx.IDataContext, domManager: wx.IDomManager, state: any, cleanup: Rx.CompositeDisposable, module: wx.IModule): void;
        update(el: HTMLElement, value: any, ctx: wx.IDataContext, domManager: wx.IDomManager, state: any, cleanup: Rx.CompositeDisposable, module: wx.IModule): void;
        cleanup?(el: HTMLElement, domManager: wx.IDomManager, state: any, cleanup: Rx.CompositeDisposable, module: wx.IModule): void;
    }
    interface ISimpleBinding extends IBindingHandler {
        inner: ISimpleBindingHandler;
    }
    interface IBindingRegistry {
        binding(name: string, handler: IBindingHandler | ISimpleBindingHandler, controlsDescendants?: boolean): IBindingRegistry;
        binding(name: string, handler: string): IBindingRegistry;
        binding(names: string[], handler: IBindingHandler): IBindingRegistry;
        binding(names: string[], handler: string): IBindingRegistry;
        binding(name: string): IBindingHandler;
    }
    interface IComponentTemplateDescriptor {
        require?: string;
        promise?: Rx.IPromise<Node[]>;
        observable?: Rx.Observable<Node[]>;
        resolve?: string;
        select?: string;
    }
    interface IComponentViewModelDescriptor {
        require?: string;
        promise?: Rx.IPromise<any>;
        observable?: Rx.Observable<any>;
        resolve?: string;
        instance?: any;
    }
    interface IComponentDescriptor {
        require?: string;
        resolve?: string;
        template?: string | Node[] | IComponentTemplateDescriptor | ((params?: any) => string | Node[]);
        viewModel?: Array<any> | IComponentViewModelDescriptor | ((params: any) => any);
        preBindingInit?: string;
        postBindingInit?: string;
    }
    interface IComponent {
        template?: Node[];
        viewModel?: any;
        preBindingInit?: string;
        postBindingInit?: string;
    }
    interface IComponentRegistry {
        component(name: string, descriptor: IComponentDescriptor | Rx.Observable<IComponentDescriptor> | Rx.IPromise<wx.IComponentDescriptor>): IComponentRegistry;
        hasComponent(name: string): boolean;
        loadComponent(name: string, params?: Object): Rx.Observable<IComponent>;
    }
    interface IExpressionFilterRegistry {
        filter(name: string, filter: IExpressionFilter): IExpressionFilterRegistry;
        filter(name: string): IExpressionFilter;
        filters(): {
            [filterName: string]: IExpressionFilter;
        };
    }
    interface IAnimationRegistry {
        animation(name: string, animation: IAnimation): IAnimationRegistry;
        animation(name: string): IAnimation;
    }
    interface IModuleDescriptor {
        (module: IModule): void;
        require?: string;
        promise?: Rx.IPromise<string>;
        resolve?: string;
        instance?: any;
    }
    interface IModule extends IComponentRegistry, IBindingRegistry, IExpressionFilterRegistry, IAnimationRegistry {
        name: string;
        merge(other: IModule): IModule;
    }
    /**
    * Represents an engine responsible for converting arbitrary text fragements into a collection of Dom Nodes
    * @interface
    **/
    interface ITemplateEngine {
        parse(templateSource: string): Node[];
    }
    interface IWebRxApp extends IModule {
        defaultExceptionHandler: Rx.Observer<Error>;
        mainThreadScheduler: Rx.IScheduler;
        templateEngine: ITemplateEngine;
        history: IHistory;
        title: IObservableProperty<string>;
        version: string;
        devModeEnable(): void;
    }
    interface IRoute {
        parse(url: any): Object;
        stringify(params?: Object): string;
        concat(route: IRoute): IRoute;
        isAbsolute: boolean;
        params: Array<string>;
    }
    interface IViewAnimationDescriptor {
        enter?: string | IAnimation;
        leave?: string | IAnimation;
    }
    interface IRouterStateConfig {
        name: string;
        url?: string | IRoute;
        views?: {
            [view: string]: string | {
                component: string;
                params?: any;
                animations?: IViewAnimationDescriptor;
            };
        };
        params?: any;
        onEnter?: (config: IRouterStateConfig, params?: any) => void;
        onLeave?: (config: IRouterStateConfig, params?: any) => void;
    }
    interface IRouterState {
        name: string;
        url: string;
        params: any;
        views: {
            [view: string]: string | {
                component: string;
                params?: any;
                animations?: IViewAnimationDescriptor;
            };
        };
        onEnter?: (config: IRouterStateConfig, params?: any) => void;
        onLeave?: (config: IRouterStateConfig, params?: any) => void;
    }
    interface IViewConfig {
        component: string;
        params?: any;
        animations?: IViewAnimationDescriptor;
    }
    interface IViewTransition {
        view: string;
        fromComponent?: string;
        toComponent: string;
    }
    const enum RouterLocationChangeMode {
        add = 1,
        replace = 2,
    }
    interface IStateChangeOptions {
        /**
        * If true will update the url in the location bar, if false will not.
        **/
        location?: boolean | RouterLocationChangeMode;
        /**
        * If true will force transition even if the state or params have not changed, aka a reload of the same state.
        **/
        force?: boolean;
    }
    interface IHistory {
        onPopState: Rx.Observable<PopStateEvent>;
        location: Location;
        length: number;
        state: any;
        back(): void;
        forward(): void;
        replaceState(statedata: any, title: string, url?: string): void;
        pushState(statedata: any, title: string, url?: string): void;
        getSearchParameters(query?: string): Object;
    }
    interface IRouter {
        /**
        * Transitions to the state inferred from the specified url or the browser's current location
        * This method should be invoked once after registering application states.
        * @param {string} url If specified the router state will be synced to this value, otherwise to window.location.path
        **/
        sync(url?: string): void;
        /**
        * Registers a state configuration under a given state name.
        * @param {IRouterStateConfig} config State configuration to register
        **/
        state(config: IRouterStateConfig): IRouter;
        /**
        * Represents the configuration object for the router's
        **/
        current: IObservableProperty<IRouterState>;
        /**
        * An observable that notifies of completed view transitions in response to router state changes
        **/
        viewTransitions: Rx.Observable<IViewTransition>;
        /**
        * Invoke this method to programatically alter or extend IRouter.current.params.
        * Failure to modify params through this method will result in those modifications getting lost after state transitions.
        **/
        updateCurrentStateParams(withParamsAction: (params: any) => void): void;
        /**
        * Method for transitioning to a new state.
        * @param {string} to Absolute or relative destination state path. 'contact.detail' - will go to the
        * contact.detail state. '^'  will go to a parent state. '^.sibling' - will go to a sibling state and
        * '.child.grandchild' will go to grandchild state
        * @param {Object} params A map of the parameters that will be sent to the state.
        * Any parameters that are not specified will be inherited from currently defined parameters.
        * @param {IStateChangeOptions} options Options controlling how the state transition will be performed
        **/
        go(to: string, params?: Object, options?: IStateChangeOptions): void;
        /**
        * An URL generation method that returns the URL for the given state populated with the given params.
        * @param {string} state Absolute or relative destination state path. 'contact.detail' - will go to the
        * contact.detail state. '^'  will go to a parent state. '^.sibling' - will go to a sibling state and
        * '.child.grandchild' will go to grandchild state
        * @param {Object} params An object of parameter values to fill the state's required parameters.
        **/
        url(state: string, params?: {}): string;
        /**
        * A method that force reloads the current state. All resolves are re-resolved, events are not re-fired,
        * and components reinstantiated.
        **/
        reload(): void;
        /**
        * Returns the state configuration object for any specific state.
        * @param {string} state Absolute state path.
        **/
        get(state: string): IRouterStateConfig;
        /**
        * Similar to IRouter.includes, but only checks for the full state name. If params is supplied then it will
        * be tested for strict equality against the current active params object, so all params must match with none
        * missing and no extras.
        * @param {string} state Absolute state path.
        **/
        is(state: string, params?: any, options?: any): any;
        /**
        * A method to determine if the current active state is equal to or is the child of the state stateName.
        * If any params are passed then they will be tested for a match as well. Not all the parameters need
        * to be passed, just the ones you'd like to test for equality.
        * @param {string} state Absolute state path.
        **/
        includes(state: string, params?: any, options?: any): any;
        /**
        * Resets internal state configuration to defaults (for unit-testing)
        **/
        reset(): void;
        /**
        * Returns the view-configuration for the specified view at the current state
        **/
        getViewComponent(viewName: string): IViewConfig;
    }
    /**
    * IMessageBus represents an object that can act as a "Message Bus", a
    * simple way for ViewModels and other objects to communicate with each
    * other in a loosely coupled way.
    *
    * Specifying which messages go where is done via the contract parameter
    **/
    interface IMessageBus {
        /**
        * Registers a scheduler for the type, which may be specified at
        * runtime, and the contract.
        *
        * If a scheduler is already registered for the specified
        * runtime and contract, this will overrwrite the existing
        * registration.
        *
        * @param {string} contract A unique string to distinguish messages with
        * identical types (i.e. "MyCoolViewModel")
        **/
        registerScheduler(scheduler: Rx.IScheduler, contract: string): void;
        /**
        * Listen provides an Observable that will fire whenever a Message is
        * provided for this object via RegisterMessageSource or SendMessage.
        *
        * @param {string} contract A unique string to distinguish messages with
        * identical types (i.e. "MyCoolViewModel")
        **/
        listen<T>(contract: string): Rx.IObservable<T>;
        /**
        * Determines if a particular message Type is registered.
        * @param {string} The type of the message.
        *
        * @param {string} contract A unique string to distinguish messages with
        * identical types (i.e. "MyCoolViewModel")
        * @return True if messages have been posted for this message Type.
        **/
        isRegistered(contract: string): boolean;
        /**
        * Registers an Observable representing the stream of messages to send.
        * Another part of the code can then call Listen to retrieve this
        * Observable.
        *
        * @param {string} contract A unique string to distinguish messages with
        * identical types (i.e. "MyCoolViewModel")
        **/
        registerMessageSource<T>(source: Rx.Observable<T>, contract: string): Rx.IDisposable;
        /**
        * Sends a single message using the specified Type and contract.
        * Consider using RegisterMessageSource instead if you will be sending
        * messages in response to other changes such as property changes
        * or events.
        *
        * @param {T} message The actual message to send
        * @param {string} contract A unique string to distinguish messages with
        * identical types (i.e. "MyCoolViewModel")
        **/
        sendMessage<T>(message: T, contract: string): void;
    }
    interface ICommandBindingOptions {
        command: wx.ICommand<any>;
        parameter?: any;
    }
    interface IComponentBindingOptions {
        name: string;
        params?: Object;
    }
    interface IEventBindingOptions {
        [eventName: string]: (ctx: wx.IDataContext, event: Event) => any | Rx.Observer<Event> | {
            command: wx.ICommand<any>;
            parameter: any;
        };
    }
    interface IForeachAnimationDescriptor {
        itemEnter?: string | wx.IAnimation;
        itemLeave?: string | wx.IAnimation;
    }
    interface IForEachBindingOptions extends IForeachAnimationDescriptor {
        data: any;
        hooks?: IForEachBindingHooks | string;
    }
    interface IForEachBindingHooks {
        /**
        * wx.Is invoked each time the foreach block is duplicated and inserted into the document,
        * both when foreach first initializes, and when new entries are added to the associated
        * array later
        **/
        afterRender?(nodes: Node[], data: any): void;
        /**
        * wx.Is like afterRender, except it is invoked only when new entries are added to your array
        * (and not when foreach first iterates over your array’s initial contents).
        * A common use for afterAdd is to call a method such as jQuery’s $(domNode).fadeIn()
        * so that you get animated transitions whenever items are added
        **/
        afterAdd?(nodes: Node[], data: any, index: number): void;
        /**
        * wx.Is invoked when an array item has been removed, but before the corresponding
        * DOM nodes have been removed. wx.If you specify a beforeRemove callback, then it
        * becomes your responsibility to remove the DOM nodes. The obvious use case here
        * is calling something like jQuery’s $(domNode).fadeOut() to animate the removal
        * of the corresponding DOM nodes — in this case, WebRx cannot know how soon
        * it is allowed to physically remove the DOM nodes (who knows how long your
        * animation will take?)
        **/
        beforeRemove?(nodes: Node[], data: any, index: number): void;
        /**
        * wx.Is invoked when an array item has changed position in the array, but before
        * the corresponding DOM nodes have been moved. You could use beforeMove
        * to store the original screen coordinates of the affected elements so that you
        * can animate their movements in the afterMove callback.
        **/
        beforeMove?(nodes: Node[], data: any, index: number): void;
        /**
        * wx.Is invoked after an array item has changed position in the array, and after
        * foreach has updated the DOM to match.
        **/
        afterMove?(nodes: Node[], data: any, index: number): void;
    }
    interface IHasFocusBindingOptions {
        property: any;
        delay: number;
    }
    interface IIfAnimationDescriptor {
        enter?: string | wx.IAnimation;
        leave?: string | wx.IAnimation;
    }
    interface IIfBindingOptions extends IIfAnimationDescriptor {
        condition: string;
    }
    interface IKeyPressBindingOptions {
        [key: string]: (ctx: wx.IDataContext, event: Event) => any | wx.ICommand<any> | {
            command: wx.ICommand<any>;
            parameter: any;
        };
    }
    interface IVisibleBindingOptions {
        useCssClass: boolean;
        hiddenClass: string;
    }
    interface IRadioGroupComponentParams {
        items: any;
        groupName?: string;
        itemText?: string;
        itemValue?: string;
        itemClass?: string;
        selectedValue?: any;
        afterRender?(nodes: Node[], data: any): void;
        noCache?: boolean;
    }
    interface ISelectComponentParams {
        name?: string;
        items: any;
        itemText?: string;
        itemValue?: string;
        itemClass?: string;
        cssClass?: string;
        multiple?: boolean;
        required?: boolean;
        autofocus?: boolean;
        size?: number;
        selectedValue?: any;
        afterRender?(nodes: Node[], data: any): void;
        noCache?: boolean;
    }
    interface IBrowserProperties {
        version: number;
    }
    interface IIEBrowserProperties extends IBrowserProperties {
        getSelectionChangeObservable(el: HTMLElement): Rx.Observable<Document>;
    }
    interface IStateActiveBindingOptions {
        name: string;
        params?: Object;
        cssClass?: string;
    }
    interface IStateRefBindingOptions {
        name: string;
        params?: Object;
    }
    interface IHttpClientOptions {
        url?: string;
        method?: string;
        params?: Object;
        data?: any;
        headers?: Object;
        raw?: boolean;
        dump?: (value: any) => string;
        load?: (text: string) => Object;
        xmlHttpRequest?: () => XMLHttpRequest;
        promise?: (executor: (resolve: (value?: any | PromiseLike<any>) => void, reject: (reason?: any) => void) => void) => Promise<any>;
    }
    interface IHttpClient {
        /**
        * Performs a http-get-request
        *
        * @param {string} url The request url
        * @param {Object} params Query string parameters to be appended to the request url. Values will be uri-encoded
        * @param {wx.IHttpClientOptions} options Configuration options, overriding the instance's current configuration
        **/
        get<T>(url: string, params?: Object, options?: wx.IHttpClientOptions): Rx.IPromise<T>;
        /**
        * Performs a http-put-request
        *
        * @param {string} url The request url
        * @param {any} data The data to be sent to the server
        * @param {wx.IHttpClientOptions} options Configuration options, overriding the instance's current configuration
        **/
        put<T>(url: string, data: any, options?: wx.IHttpClientOptions): Rx.IPromise<T>;
        /**
        * Performs a http-post-request
        *
        * @param {string} url The request url
        * @param {any} data The data to be sent to the server
        * @param {wx.IHttpClientOptions} options Configuration options, overriding the instance's current configuration
        **/
        post<T>(url: string, data: any, options?: wx.IHttpClientOptions): Rx.IPromise<T>;
        /**
        * Performs a http-patch-request
        *
        * @param {string} url The request url
        * @param {any} data The data to be sent to the server
        * @param {wx.IHttpClientOptions} options Configuration options, overriding the instance's current configuration
        **/
        patch<T>(url: string, data: any, options?: wx.IHttpClientOptions): Rx.IPromise<T>;
        /**
        * Performs a http-delete-request
        *
        * @param {string} url The request url
        * @param {wx.IHttpClientOptions} options Configuration options, overriding the instance's current configuration
        **/
        delete(url: string, options?: wx.IHttpClientOptions): Rx.IPromise<any>;
        /**
        * Performs a http-options-request
        *
        * @param {string} url The request url
        * @param {wx.IHttpClientOptions} options Configuration options, overriding the instance's current configuration
        **/
        options(url: string, options?: wx.IHttpClientOptions): Rx.IPromise<any>;
        /**
        * Performs a http-request according to the specified options
        *
        * @param {wx.IHttpClientOptions} options Configuration options, overriding the instance's current configuration
        **/
        request<T>(options: wx.IHttpClientOptions): Rx.IPromise<T>;
        /**
        * Configures this HttpClient instance
        *
        * @param {wx.IHttpClientOptions} opts The configuration object
        **/
        configure(opts: wx.IHttpClientOptions): void;
    }
}
