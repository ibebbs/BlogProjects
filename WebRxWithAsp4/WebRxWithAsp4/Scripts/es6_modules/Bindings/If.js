/// <reference path="../Interfaces.ts" />
import { throwError, nodeChildrenToArray, unwrapProperty } from "../Core/Utils";
"use strict";
export class IfBinding {
    constructor(domManager, app) {
        this.priority = 50;
        this.controlsDescendants = true;
        ////////////////////
        // Implementation
        this.inverse = false;
        this.domManager = domManager;
        this.app = app;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("if-binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let compiled = this.domManager.compileBindingOptions(options, module);
        let el = node;
        let self = this;
        let initialApply = true;
        let exp;
        let animations = {};
        let cleanup;
        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }
        if (typeof compiled === "object") {
            let opt = compiled;
            exp = opt.condition;
            // extract animations
            if (opt.enter) {
                animations.enter = this.domManager.evaluateExpression(opt.enter, ctx);
                if (typeof animations.enter === "string") {
                    animations.enter = module.animation(animations.enter);
                }
            }
            if (opt.leave) {
                animations.leave = this.domManager.evaluateExpression(opt.leave, ctx);
                if (typeof animations.leave === "string") {
                    animations.leave = module.animation(animations.leave);
                }
            }
        }
        else {
            exp = compiled;
        }
        let obs = this.domManager.expressionToObservable(exp, ctx);
        // backup inner HTML
        let template = new Array();
        // subscribe
        state.cleanup.add(obs.subscribe(x => {
            try {
                doCleanup();
                cleanup = new Rx.CompositeDisposable();
                cleanup.add(self.applyValue(el, unwrapProperty(x), template, ctx, animations, initialApply));
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
        }));
    }
    configure(options) {
        // intentionally left blank
    }
    applyValue(el, value, template, ctx, animations, initialApply) {
        let leaveAnimation = animations.leave;
        let enterAnimation = animations.enter;
        let self = this;
        let obs = undefined;
        if (initialApply) {
            // clone to template
            for (let i = 0; i < el.childNodes.length; i++) {
                template.push(el.childNodes[i].cloneNode(true));
            }
            // clear
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
        }
        let oldElements = nodeChildrenToArray(el);
        value = this.inverse ? !value : value;
        function removeOldElements() {
            oldElements.forEach(x => {
                self.domManager.cleanNode(x);
                el.removeChild(x);
            });
        }
        if (oldElements.length > 0) {
            if (leaveAnimation) {
                leaveAnimation.prepare(oldElements);
                obs = leaveAnimation.run(oldElements)
                    .continueWith(() => leaveAnimation.complete(oldElements))
                    .continueWith(removeOldElements);
            }
            else {
                removeOldElements();
            }
        }
        if (value) {
            let nodes = template.map(x => x.cloneNode(true));
            if (obs) {
                obs = obs.continueWith(() => {
                    if (enterAnimation)
                        enterAnimation.prepare(nodes);
                    for (let i = 0; i < template.length; i++) {
                        el.appendChild(nodes[i]);
                    }
                    this.domManager.applyBindingsToDescendants(ctx, el);
                });
                if (enterAnimation) {
                    obs = enterAnimation.run(nodes)
                        .continueWith(() => enterAnimation.complete(nodes));
                }
            }
            else {
                if (enterAnimation)
                    enterAnimation.prepare(nodes);
                for (let i = 0; i < template.length; i++) {
                    el.appendChild(nodes[i]);
                }
                this.domManager.applyBindingsToDescendants(ctx, el);
                if (enterAnimation) {
                    obs = enterAnimation.run(nodes)
                        .continueWith(() => enterAnimation.complete(nodes));
                }
            }
        }
        return obs ? (obs.subscribe() || Rx.Disposable.empty) : Rx.Disposable.empty;
    }
}
export class NotIfBinding extends IfBinding {
    constructor(domManager, app) {
        super(domManager, app);
        this.inverse = true;
    }
}
//# sourceMappingURL=If.js.map