/// <reference path="../Interfaces.ts" />
import { createWeakMap } from "../Collections/WeakMap";
import { createSet, setToArray } from "../Collections/Set";
import { createMap } from "../Collections/Map";
import { injector } from "./Injector";
import { extend, throwError, isRxObservable, isProperty } from "../Core/Utils";
import * as res from "./Resources";
import * as env from "./Environment";
import { isList } from "../Collections/ListSupport";
"use strict";
/**
* The heart of WebRx's binding-system
* @class
*/
export class DomManager {
    constructor(compiler, app) {
        this.expressionCache = {};
        this.dataContextExtensions = createSet();
        this.parserOptions = {
            disallowFunctionCalls: false
        };
        this.nodeState = createWeakMap();
        this.compiler = compiler;
        this.app = app;
    }
    applyBindings(model, rootNode) {
        if (rootNode === undefined || rootNode.nodeType !== 1)
            throwError("first parameter should be your model, second parameter should be a DOM node!");
        if (this.isNodeBound(rootNode))
            throwError("an element must not be bound multiple times!");
        // create or update node state for root node
        let state = this.getNodeState(rootNode);
        if (state) {
            state.model = model;
        }
        else {
            state = this.createNodeState(model);
            this.setNodeState(rootNode, state);
        }
        // calculate resulting data-context and apply bindings
        let ctx = this.getDataContext(rootNode);
        this.applyBindingsRecursive(ctx, rootNode);
    }
    applyBindingsToDescendants(ctx, node) {
        if (node.hasChildNodes()) {
            for (let i = 0; i < node.childNodes.length; i++) {
                let child = node.childNodes[i];
                // only elements
                if (child.nodeType !== 1)
                    continue;
                this.applyBindingsRecursive(ctx, child);
            }
        }
    }
    cleanNode(rootNode) {
        if (rootNode.nodeType !== 1)
            return;
        this.cleanNodeRecursive(rootNode);
    }
    cleanDescendants(node) {
        if (node.hasChildNodes()) {
            for (let i = 0; i < node.childNodes.length; i++) {
                let child = node.childNodes[i];
                // only elements
                if (child.nodeType !== 1)
                    continue;
                this.cleanNodeRecursive(child);
                this.clearNodeState(child);
            }
        }
    }
    getObjectLiteralTokens(value) {
        value = value.trim();
        if (value !== '' && this.isObjectLiteralString(value)) {
            return this.compiler.parseObjectLiteral(value);
        }
        return [];
    }
    compileBindingOptions(value, module) {
        value = value.trim();
        if (value === '') {
            return null;
        }
        if (this.isObjectLiteralString(value)) {
            let result = {};
            let tokens = this.compiler.parseObjectLiteral(value);
            let token;
            for (let i = 0; i < tokens.length; i++) {
                token = tokens[i];
                result[token.key] = this.compileBindingOptions(token.value, module);
            }
            return result;
        }
        else {
            // build compiler options
            let options = extend(this.parserOptions, {});
            options.filters = {};
            // enrich with app filters
            extend(this.app.filters(), options.filters);
            // enrich with module filters
            if (module && module.name != "app") {
                extend(module.filters(), options.filters);
            }
            return this.compiler.compileExpression(value, options, this.expressionCache);
        }
    }
    getModuleContext(node) {
        let state;
        // collect model hierarchy
        while (node) {
            state = this.getNodeState(node);
            if (state != null) {
                if (state.module != null) {
                    return state.module;
                }
            }
            node = node.parentNode;
        }
        // default to app
        return this.app;
    }
    registerDataContextExtension(extension) {
        this.dataContextExtensions.add(extension);
    }
    getDataContext(node) {
        let models = [];
        let state = this.getNodeState(node);
        // collect model hierarchy
        let _node = node;
        while (_node) {
            state = state != null ? state : this.getNodeState(_node);
            if (state != null) {
                if (state.model != null) {
                    models.push(state.model);
                }
            }
            state = null;
            _node = _node.parentNode;
        }
        let ctx;
        if (models.length > 0) {
            ctx = {
                $data: models[0],
                $root: models[models.length - 1],
                $parent: models.length > 1 ? models[1] : null,
                $parents: models.slice(1)
            };
        }
        else {
            ctx = {
                $data: null,
                $root: null,
                $parent: null,
                $parents: []
            };
        }
        // extensions
        this.dataContextExtensions.forEach(ext => ext(node, ctx));
        return ctx;
    }
    createNodeState(model, module) {
        return {
            cleanup: new Rx.CompositeDisposable(),
            model: model,
            module: module,
            isBound: false
        };
    }
    isNodeBound(node) {
        let state = this.nodeState.get(node);
        return state != null && !!state.isBound;
    }
    setNodeState(node, state) {
        this.nodeState.set(node, state);
    }
    getNodeState(node) {
        return this.nodeState.get(node);
    }
    clearNodeState(node) {
        let state = this.nodeState.get(node);
        if (state != null) {
            if (state.cleanup != null) {
                state.cleanup.dispose();
                state.cleanup = undefined;
            }
            state.model = undefined;
            state.module = undefined;
            // delete state itself
            this.nodeState.delete(node);
        }
        // support external per-node cleanup
        env.cleanExternalData(node);
    }
    evaluateExpression(exp, ctx) {
        let locals = this.createLocals(undefined, ctx);
        let result = exp(ctx.$data, locals);
        return result;
    }
    expressionToObservable(exp, ctx, evalObs) {
        let captured = createSet();
        let locals;
        let result;
        // initial evaluation
        try {
            locals = this.createLocals(captured, ctx);
            result = exp(ctx.$data, locals);
            // diagnostics
            if (evalObs)
                evalObs.onNext(true);
        }
        catch (e) {
            this.app.defaultExceptionHandler.onNext(e);
            return Rx.Observable.return(undefined);
        }
        // Optimization: If the initial evaluation didn't touch any observables, treat it as constant expression
        if (captured.size === 0) {
            if (isRxObservable(result))
                return result;
            // wrap it
            return Rx.Observable.return(result);
        }
        // create a subject that receives values from all dependencies
        let allSeeingEye = new Rx.Subject();
        // associate observables with subscriptions
        let subs = createMap();
        // subscribe initial dependencies to subject
        let arr = setToArray(captured);
        let length = arr.length;
        let o;
        for (let i = 0; i < length; i++) {
            o = arr[i];
            subs.set(o, o.replay(null, 1).refCount().subscribe(allSeeingEye));
        }
        let obs = Rx.Observable.create(observer => {
            let innerDisp = allSeeingEye.subscribe(trigger => {
                try {
                    let capturedNew = createSet();
                    locals = this.createLocals(capturedNew, ctx);
                    // evaluate and produce next value
                    result = exp(ctx.$data, locals);
                    // house-keeping: let go of unused observables
                    let arr = setToArray(captured);
                    let length = arr.length;
                    for (let i = 0; i < length; i++) {
                        o = arr[i];
                        if (!capturedNew.has(o)) {
                            let disp = subs.get(o);
                            if (disp != null)
                                disp.dispose();
                            subs.delete(o);
                        }
                    }
                    // add new ones
                    arr = setToArray(capturedNew);
                    length = arr.length;
                    for (let i = 0; i < length; i++) {
                        o = arr[i];
                        captured.add(o);
                        if (!subs.has(o)) {
                            subs.set(o, o.replay(null, 1).refCount().subscribe(allSeeingEye));
                        }
                    }
                    // emit new value
                    if (!isRxObservable(result)) {
                        // wrap non-observable
                        observer.onNext(Rx.Observable.return(result));
                    }
                    else {
                        observer.onNext(result);
                    }
                    // diagnostics
                    if (evalObs)
                        evalObs.onNext(true);
                }
                catch (e) {
                    this.app.defaultExceptionHandler.onNext(e);
                }
            });
            return Rx.Disposable.create(() => {
                innerDisp.dispose();
                // dispose subscriptions
                subs.forEach((value, key, map) => {
                    if (value)
                        value.dispose();
                });
                // cleanup
                subs.clear();
                subs = null;
                captured.clear();
                captured = null;
                allSeeingEye.dispose();
                allSeeingEye = null;
                locals = null;
            });
        });
        // prefix with initial result
        let startValue = isRxObservable(result) ?
            result :
            Rx.Observable.return(result);
        return obs.startWith(startValue).concatAll();
    }
    applyBindingsInternal(ctx, el, module) {
        let result = false;
        // get or create elment-state
        let state = this.getNodeState(el);
        // create and set if necessary
        if (!state) {
            state = this.createNodeState();
            this.setNodeState(el, state);
        }
        else if (state.isBound) {
            throwError("an element may be bound multiple times!");
        }
        let _bindings;
        let tagName = el.tagName.toLowerCase();
        // check if tag represents a component
        if (module.hasComponent(tagName) || this.app.hasComponent(tagName)) {
            // when a component is referenced as custom-element, apply a virtual 'component' binding
            let params = el.getAttribute(DomManager.paramsAttributename);
            let componentReference;
            if (params)
                componentReference = `{ name: '${tagName}', params: { ${el.getAttribute(DomManager.paramsAttributename)} }}`;
            else
                componentReference = `{ name: '${tagName}' }`;
            _bindings = [{ key: 'component', value: componentReference }];
        }
        else {
            // get definitions from attribute
            _bindings = this.getBindingDefinitions(el);
        }
        if (_bindings != null && _bindings.length > 0) {
            // lookup handlers
            let bindings = _bindings.map(x => {
                let handler = module.binding(x.key);
                if (!handler)
                    throwError("binding '{0}' has not been registered.", x.key);
                return { handler: handler, value: x.value };
            });
            // sort by priority
            bindings.sort((a, b) => (b.handler.priority || 0) - (a.handler.priority || 0));
            // check if there's binding-handler competition for descendants (which is illegal)
            let hd = bindings.filter(x => x.handler.controlsDescendants).map(x => "'" + x.value + "'");
            if (hd.length > 1) {
                throwError("bindings {0} are competing for descendants of target element!", hd.join(", "));
            }
            result = hd.length > 0;
            // apply all bindings
            for (let i = 0; i < bindings.length; i++) {
                let binding = bindings[i];
                let handler = binding.handler;
                handler.applyBinding(el, binding.value, ctx, state, module);
            }
        }
        // mark bound
        state.isBound = true;
        return result;
    }
    isObjectLiteralString(str) {
        return str[0] === "{" && str[str.length - 1] === "}";
    }
    getBindingDefinitions(node) {
        let bindingText = null;
        if (node.nodeType === 1) {
            // attempt to get definition from attribute
            let attr = node.getAttribute(DomManager.bindingAttributeName);
            if (attr) {
                bindingText = attr;
            }
        }
        // transform textual binding-definition into a key-value store where
        // the key is the binding name and the value is its options
        if (bindingText) {
            bindingText = bindingText.trim();
        }
        if (bindingText)
            return this.compiler.parseObjectLiteral(bindingText);
        return null;
    }
    applyBindingsRecursive(ctx, el, module) {
        // "module" binding receiving first-class treatment here because it is considered part of the core
        module = module || this.getModuleContext(el);
        if (!this.applyBindingsInternal(ctx, el, module) && el.hasChildNodes()) {
            // module binding might have updated state.module
            let state = this.getNodeState(el);
            if (state && state.module)
                module = state.module;
            // iterate over descendants
            for (let i = 0; i < el.childNodes.length; i++) {
                let child = el.childNodes[i];
                // only elements
                if (child.nodeType !== 1)
                    continue;
                this.applyBindingsRecursive(ctx, child, module);
            }
        }
    }
    cleanNodeRecursive(node) {
        if (node.hasChildNodes()) {
            let length = node.childNodes.length;
            for (let i = 0; i < length; i++) {
                let child = node.childNodes[i];
                // only elements
                if (child.nodeType !== 1)
                    continue;
                this.cleanNodeRecursive(child);
            }
        }
        // clear parent after childs
        this.clearNodeState(node);
    }
    createLocals(captured, ctx) {
        let locals = {};
        let list;
        let prop;
        let result, target;
        let hooks = {
            readFieldHook: (o, field) => {
                // handle "@propref" access-modifier
                let noUnwrap = false;
                if (field[0] === '@') {
                    noUnwrap = true;
                    field = field.substring(1);
                }
                result = o[field];
                // intercept access to observable properties
                if (isProperty(result)) {
                    let prop = result;
                    // get the property's real value
                    if (!noUnwrap)
                        result = prop();
                    // register observable
                    if (captured)
                        captured.add(prop.changed);
                }
                return result;
            },
            writeFieldHook: (o, field, newValue) => {
                // ignore @propref access-modifier on writes
                if (field[0] === '@') {
                    field = field.substring(1);
                }
                target = o[field];
                // intercept access to observable properties
                if (isProperty(target)) {
                    let prop = target;
                    // register observable
                    if (captured)
                        captured.add(prop.changed);
                    // replace field assignment with property invocation
                    prop(newValue);
                }
                else {
                    o[field] = newValue;
                }
                return newValue;
            },
            readIndexHook: (o, index) => {
                // recognize observable lists
                if (isList(o)) {
                    // translate indexer to list.get()
                    list = o;
                    result = list.get(index);
                    // add collectionChanged to monitored observables
                    if (captured)
                        captured.add(list.listChanged);
                }
                else {
                    result = o[index];
                }
                // intercept access to observable properties
                if (isProperty(result)) {
                    let prop = result;
                    // get the property's real value
                    result = prop();
                    // register observable
                    if (captured)
                        captured.add(prop.changed);
                }
                return result;
            },
            writeIndexHook: (o, index, newValue) => {
                // recognize observable lists
                if (isList(o)) {
                    // translate indexer to list.get()
                    list = o;
                    target = list.get(index);
                    // add collectionChanged to monitored observables
                    if (captured)
                        captured.add(list.listChanged);
                    // intercept access to observable properties
                    if (isProperty(target)) {
                        prop = target;
                        // register observable
                        if (captured)
                            captured.add(prop.changed);
                        // replace field assignment with property invocation
                        prop(newValue);
                    }
                    else {
                        list.set(index, newValue);
                    }
                }
                else {
                    // intercept access to observable properties
                    if (isProperty(o[index])) {
                        prop = target[index];
                        // register observable
                        if (captured)
                            captured.add(prop.changed);
                        // replace field assignment with property invocation
                        prop(newValue);
                    }
                    else {
                        o[index] = newValue;
                    }
                }
                return newValue;
            }
        };
        // install property interceptor hooks
        this.compiler.setRuntimeHooks(locals, hooks);
        // injected context members into locals
        let keys = Object.keys(ctx);
        let length = keys.length;
        for (let i = 0; i < length; i++) {
            let key = keys[i];
            locals[key] = ctx[key];
        }
        return locals;
    }
}
//////////////////////////////////
// Implementation
DomManager.bindingAttributeName = "data-bind";
DomManager.paramsAttributename = "params";
/**
* Applies bindings to the specified node and all of its children using the specified data context.
* @param {any} model The model to bind to
* @param {Node} rootNode The node to be bound
*/
export function applyBindings(model, node) {
    injector.get(res.domManager).applyBindings(model, node || (window != null ? window.document.documentElement : null));
}
/**
* Removes and cleans up any binding-related state from the specified node and its descendants.
* @param {Node} rootNode The node to be cleaned
*/
export function cleanNode(node) {
    injector.get(res.domManager).cleanNode(node);
}
//# sourceMappingURL=DomManager.js.map