/// <reference path="../RxExtensions.d.ts" />
import { throwError, cloneNodeArray, noop } from "../Core/Utils";
import VirtualChildNodes from "./../Core/VirtualChildNodes";
import RefCountDisposeWrapper from "./../Core/RefCountDisposeWrapper";
import { injector } from "../Core/Injector";
import { isList } from "../Collections/ListSupport";
"use strict";
export default class ForEachBinding {
    constructor(domManager, app) {
        this.priority = 40;
        this.controlsDescendants = true;
        this.domManager = domManager;
        this.app = app;
        // hook into getDataContext() to map state['index'] to ctx['$index']
        domManager.registerDataContextExtension((node, ctx) => {
            let state = domManager.getNodeState(node);
            ctx.$index = state.index;
        });
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("forEach binding only operates on elements!");
        if (options == null)
            throwError("** invalid binding options!");
        let compiled = this.domManager.compileBindingOptions(options, module);
        let el = node;
        let self = this;
        let initialApply = true;
        let cleanup = null;
        let hooks;
        let exp;
        let setProxyFunc;
        let animations = {};
        if (typeof compiled === "object" && compiled.hasOwnProperty("data")) {
            let opt = compiled;
            exp = opt.data;
            // extract animations
            if (opt.itemEnter) {
                animations.itemEnter = this.domManager.evaluateExpression(opt.itemEnter, ctx);
                if (typeof animations.itemEnter === "string") {
                    animations.itemEnter = module.animation(animations.itemEnter);
                }
            }
            if (opt.itemLeave) {
                animations.itemLeave = this.domManager.evaluateExpression(opt.itemLeave, ctx);
                if (typeof animations.itemLeave === "string") {
                    animations.itemLeave = module.animation(animations.itemLeave);
                }
            }
            if (opt.hooks) {
                // extract hooks
                hooks = this.domManager.evaluateExpression(opt.hooks, ctx);
            }
            // optionally resolve hooks if passed as string identifier
            if (typeof hooks === "string")
                hooks = injector.get(hooks);
            if (opt['debug']) {
                if (opt['debug']['setProxyFunc']) {
                    setProxyFunc = this.domManager.evaluateExpression(opt['debug']['setProxyFunc'], ctx);
                }
            }
        }
        else {
            exp = compiled;
        }
        let obs = this.domManager.expressionToObservable(exp, ctx);
        // add own disposables
        state.cleanup.add(Rx.Disposable.create(() => {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }));
        // backup inner HTML
        let template = new Array();
        // subscribe
        state.cleanup.add(obs.subscribe(x => {
            try {
                if (cleanup) {
                    cleanup.dispose();
                }
                cleanup = new Rx.CompositeDisposable();
                self.applyValue(el, x, hooks, animations, template, ctx, initialApply, cleanup, setProxyFunc);
                initialApply = false;
            }
            catch (e) {
                this.app.defaultExceptionHandler.onNext(e);
            }
        }));
        // release closure references to GC
        state.cleanup.add(Rx.Disposable.create(() => {
            // nullify args
            node = null;
            options = null;
            ctx = null;
            state = null;
            // nullify common locals
            obs = null;
            el = null;
            self = null;
            // nullify locals
            template = null;
            hooks = null;
        }));
    }
    configure(options) {
        // intentionally left blank
    }
    createIndexPropertyForNode(proxy, child, startIndex, trigger, templateLength) {
        return Rx.Observable.defer(() => {
            return Rx.Observable.create(obs => {
                return trigger.subscribe(_ => {
                    // recalculate index from node position within parent
                    let index = proxy.childNodes.indexOf(child);
                    index /= templateLength;
                    obs.onNext(index);
                });
            });
        })
            .toProperty(startIndex);
    }
    appendAllRows(proxy, list, ctx, template, hooks, animations, indexTrigger, isInitial) {
        let length = list.length();
        for (let i = 0; i < length; i++) {
            this.appendRow(proxy, i, list.get(i), ctx, template, hooks, animations, indexTrigger, isInitial);
        }
    }
    appendRow(proxy, index, item, ctx, template, hooks, animations, indexTrigger, isInitial) {
        let nodes = cloneNodeArray(template);
        let _index = index;
        let enterAnimation = animations.itemEnter;
        let cbData = {
            item: item
        };
        if (indexTrigger) {
            _index = this.createIndexPropertyForNode(proxy, nodes[0], index, indexTrigger, template.length);
            cbData.indexDisp = new RefCountDisposeWrapper(_index, 0);
        }
        cbData.index = _index;
        if (enterAnimation != null)
            enterAnimation.prepare(nodes);
        proxy.appendChilds(nodes, cbData);
        if (hooks) {
            if (hooks.afterRender)
                hooks.afterRender(nodes, item);
            if (!isInitial && hooks.afterAdd)
                hooks.afterAdd(nodes, item, index);
        }
        if (enterAnimation) {
            let disp = enterAnimation.run(nodes)
                .continueWith(() => enterAnimation.complete(nodes))
                .subscribe(x => {
                if (disp != null)
                    disp.dispose();
            });
        }
    }
    insertRow(proxy, index, item, ctx, template, hooks, animations, indexTrigger) {
        let templateLength = template.length;
        let enterAnimation = animations.itemEnter;
        let nodes = cloneNodeArray(template);
        let _index = this.createIndexPropertyForNode(proxy, nodes[0], index, indexTrigger, template.length);
        if (enterAnimation != null)
            enterAnimation.prepare(nodes);
        proxy.insertChilds(index * templateLength, nodes, {
            index: _index,
            item: item,
            indexDisp: new RefCountDisposeWrapper(_index, 0)
        });
        if (hooks) {
            if (hooks.afterRender)
                hooks.afterRender(nodes, item);
            if (hooks.afterAdd)
                hooks.afterAdd(nodes, item, index);
        }
        if (enterAnimation) {
            let disp = enterAnimation.run(nodes)
                .continueWith(() => enterAnimation.complete(nodes))
                .subscribe(x => {
                if (disp != null)
                    disp.dispose();
            });
        }
    }
    removeRow(proxy, index, item, template, hooks, animations) {
        let templateLength = template.length;
        let el = proxy.targetNode;
        let nodes = proxy.removeChilds(index * templateLength, templateLength, true);
        let leaveAnimation = animations.itemLeave;
        function removeNodes() {
            for (let i = 0; i < templateLength; i++) {
                el.removeChild(nodes[i]);
            }
        }
        if (hooks && hooks.beforeRemove) {
            hooks.beforeRemove(nodes, item, index);
        }
        else {
            if (leaveAnimation != null) {
                leaveAnimation.prepare(nodes);
                let disp = leaveAnimation.run(nodes)
                    .continueWith(() => leaveAnimation.complete(nodes))
                    .continueWith(removeNodes)
                    .subscribe(x => {
                    if (disp != null)
                        disp.dispose();
                });
            }
            else {
                removeNodes();
            }
        }
    }
    moveRow(proxy, from, to, item, template, hooks, animations, indexTrigger) {
        let templateLength = template.length;
        let el = proxy.targetNode;
        let nodes = proxy.removeChilds(from * templateLength, templateLength, true);
        let leaveAnimation = animations.itemLeave;
        let enterAnimation = animations.itemEnter;
        let combined = [];
        let obs;
        let self = this;
        if (hooks && hooks.beforeMove) {
            hooks.beforeMove(nodes, item, from);
        }
        function removeNodes() {
            for (let i = 0; i < templateLength; i++) {
                el.removeChild(nodes[i]);
            }
        }
        function createRow() {
            // create new row
            nodes = cloneNodeArray(template);
            let _index = self.createIndexPropertyForNode(proxy, nodes[0], from, indexTrigger, template.length);
            if (enterAnimation != null)
                enterAnimation.prepare(nodes);
            proxy.insertChilds(templateLength * to, nodes, {
                index: _index,
                item: item,
                indexDisp: new RefCountDisposeWrapper(_index, 0)
            });
            if (hooks && hooks.afterMove) {
                hooks.afterMove(nodes, item, from);
            }
        }
        // construct leave-observable
        if (leaveAnimation) {
            leaveAnimation.prepare(nodes);
            obs = leaveAnimation.run(nodes)
                .continueWith(() => leaveAnimation.complete(nodes))
                .continueWith(removeNodes);
        }
        else {
            obs = Rx.Observable.startDeferred(removeNodes);
        }
        combined.push(obs);
        // construct enter-observable
        obs = Rx.Observable.startDeferred(createRow);
        if (enterAnimation) {
            obs = obs.continueWith(enterAnimation.run(nodes))
                .continueWith(() => enterAnimation.complete(nodes));
        }
        combined.push(obs);
        // optimize return
        if (combined.length > 1)
            obs = Rx.Observable.combineLatest(combined, noop).take(1);
        else if (combined.length === 1)
            obs = combined[0].take(1);
        let disp = obs.subscribe(x => {
            if (disp != null)
                disp.dispose();
        });
    }
    rebindRow(proxy, index, item, template, indexTrigger) {
        let templateLength = template.length;
        let _index = this.createIndexPropertyForNode(proxy, proxy.childNodes[(index * templateLength)], index, indexTrigger, template.length);
        let indexDisp = new RefCountDisposeWrapper(_index, 0);
        for (let i = 0; i < template.length; i++) {
            let node = proxy.childNodes[(index * templateLength) + i];
            if (node.nodeType === 1) {
                this.domManager.cleanNode(node);
                let state = this.domManager.createNodeState(item);
                state.index = _index;
                indexDisp.addRef();
                state.cleanup.add(indexDisp);
                this.domManager.setNodeState(node, state);
                this.domManager.applyBindings(item, node);
            }
        }
    }
    observeList(proxy, ctx, template, cleanup, list, hooks, animations, indexTrigger) {
        let i;
        let length;
        cleanup.add(indexTrigger);
        // initial insert
        this.appendAllRows(proxy, list, ctx, template, hooks, animations, indexTrigger, true);
        // track changes
        cleanup.add(list.itemsAdded.subscribe((e) => {
            length = e.items.length;
            if (e.from === list.length()) {
                for (let i = 0; i < length; i++) {
                    this.appendRow(proxy, i + e.from, e.items[i], ctx, template, hooks, animations, indexTrigger, false);
                }
            }
            else {
                for (let i = 0; i < e.items.length; i++) {
                    this.insertRow(proxy, i + e.from, e.items[i], ctx, template, hooks, animations, indexTrigger);
                }
            }
            indexTrigger.onNext(true);
        }));
        cleanup.add(list.itemsRemoved.subscribe((e) => {
            length = e.items.length;
            for (let i = 0; i < length; i++) {
                this.removeRow(proxy, i + e.from, e.items[i], template, hooks, animations);
            }
            indexTrigger.onNext(true);
        }));
        cleanup.add(list.itemsMoved.subscribe((e) => {
            this.moveRow(proxy, e.from, e.to, e.items[0], template, hooks, animations, indexTrigger);
            indexTrigger.onNext(true);
        }));
        cleanup.add(list.itemReplaced.subscribe((e) => {
            this.rebindRow(proxy, e.from, e.items[0], template, indexTrigger);
            indexTrigger.onNext(true);
        }));
        cleanup.add(list.shouldReset.subscribe((e) => {
            proxy.clear();
            this.appendAllRows(proxy, list, ctx, template, hooks, animations, indexTrigger, false);
            indexTrigger.onNext(true);
        }));
    }
    applyValue(el, value, hooks, animations, template, ctx, initialApply, cleanup, setProxyFunc) {
        let i, length;
        if (initialApply) {
            // clone to template
            length = el.childNodes.length;
            for (let i = 0; i < length; i++) {
                template.push(el.childNodes[i].cloneNode(true));
            }
        }
        // perform initial clear
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
        if (template.length === 0)
            return; // nothing to do
        let proxy;
        let self = this;
        let recalcIndextrigger;
        function nodeInsertCB(node, callbackData) {
            let item = callbackData.item;
            let index = callbackData.index;
            let indexDisp = callbackData.indexDisp;
            if (node.nodeType === 1) {
                // propagate index to state
                let state = (self.domManager.getNodeState(node) || self.domManager.createNodeState());
                state.model = item;
                state.index = index;
                self.domManager.setNodeState(node, state);
                if (recalcIndextrigger != null && indexDisp != null) {
                    indexDisp.addRef();
                    state.cleanup.add(indexDisp);
                }
                self.domManager.applyBindings(item, node);
            }
        }
        function nodeRemoveCB(node) {
            if (node.nodeType === 1) {
                self.domManager.cleanNode(node);
            }
        }
        proxy = new VirtualChildNodes(el, false, nodeInsertCB, nodeRemoveCB);
        if (setProxyFunc)
            setProxyFunc(proxy);
        cleanup.add(Rx.Disposable.create(() => {
            proxy = null;
        }));
        if (Array.isArray(value)) {
            let arr = value;
            // iterate once and be done with it
            length = arr.length;
            for (let i = 0; i < length; i++) {
                this.appendRow(proxy, i, arr[i], ctx, template, hooks, animations, undefined, true);
            }
        }
        else if (isList(value)) {
            let list = value;
            recalcIndextrigger = new Rx.Subject();
            this.observeList(proxy, ctx, template, cleanup, list, hooks, animations, recalcIndextrigger);
        }
        else {
            throwError("forEach-Binding: value must be either array or observable list");
        }
    }
}
//# sourceMappingURL=ForEach.js.map