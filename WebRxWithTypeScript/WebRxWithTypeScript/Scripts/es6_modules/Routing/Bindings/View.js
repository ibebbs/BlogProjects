/// <reference path="../../Interfaces.ts" />
import { throwError, noop, formatString, nodeChildrenToArray, isEqual } from "../../Core/Utils";
"use strict";
export default class ViewBinding {
    constructor(domManager, router, app) {
        this.priority = 1000;
        this.controlsDescendants = true;
        this.domManager = domManager;
        this.router = router;
        this.app = app;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("view-binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        let compiled = this.domManager.compileBindingOptions(options, module);
        let viewName = this.domManager.evaluateExpression(compiled, ctx);
        let currentConfig;
        let cleanup;
        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }
        if (viewName == null || typeof viewName !== "string")
            throwError("views must be named!");
        // subscribe to router-state changes
        state.cleanup.add(this.router.current.changed.startWith(this.router.current()).subscribe(newState => {
            try {
                doCleanup();
                cleanup = new Rx.CompositeDisposable();
                let config = this.router.getViewComponent(viewName);
                if (config != null) {
                    if (!isEqual(currentConfig, config)) {
                        cleanup.add(this.applyTemplate(viewName, config.component, currentConfig ? currentConfig.component : undefined, config.params, config.animations, el, ctx, module));
                        currentConfig = config;
                    }
                }
                else {
                    cleanup.add(this.applyTemplate(viewName, null, currentConfig ? currentConfig.component : undefined, null, currentConfig ? currentConfig.animations : {}, el, ctx, module));
                    currentConfig = {};
                }
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
        }));
    }
    configure(options) {
        // intentionally left blank
    }
    applyTemplate(viewName, componentName, previousComponentName, componentParams, animations, el, ctx, module) {
        let self = this;
        let oldElements = nodeChildrenToArray(el);
        let combined = [];
        let obs;
        function removeOldElements() {
            oldElements.forEach(x => {
                self.domManager.cleanNode(x);
                el.removeChild(x);
            });
        }
        function instantiateComponent(animation) {
            // extend the data-context
            ctx.$componentParams = componentParams;
            // create component container element
            let container = document.createElement("div");
            let binding = formatString("component: { name: '{0}', params: $componentParams }", componentName);
            container.setAttribute("data-bind", binding);
            // prepare container for animation
            if (animation != null)
                animation.prepare(container);
            // now insert it
            el.appendChild(container);
            // and apply bindings
            self.domManager.applyBindings(ctx, container);
        }
        // construct leave-observable
        if (oldElements.length > 0) {
            let leaveAnimation;
            if (animations && animations.leave) {
                if (typeof animations.leave === "string") {
                    leaveAnimation = module.animation(animations.leave);
                }
                else {
                    leaveAnimation = animations.leave;
                }
            }
            if (leaveAnimation) {
                leaveAnimation.prepare(oldElements);
                obs = leaveAnimation.run(oldElements)
                    .continueWith(() => leaveAnimation.complete(oldElements))
                    .continueWith(removeOldElements);
            }
            else {
                obs = Rx.Observable.startDeferred(removeOldElements);
            }
            combined.push(obs);
        }
        // construct enter-observable
        if (componentName != null) {
            let enterAnimation;
            if (animations && animations.enter) {
                if (typeof animations.enter === "string") {
                    enterAnimation = module.animation(animations.enter);
                }
                else {
                    enterAnimation = animations.enter;
                }
            }
            obs = Rx.Observable.startDeferred(() => instantiateComponent(enterAnimation));
            if (enterAnimation) {
                obs = obs.continueWith(enterAnimation.run(el.childNodes))
                    .continueWith(() => enterAnimation.complete(el.childNodes));
            }
            // notify world
            obs = obs.continueWith(() => {
                var transition = {
                    view: viewName,
                    fromComponent: previousComponentName,
                    toComponent: componentName
                };
                var ri = this.router;
                ri.viewTransitionsSubject.onNext(transition);
            });
            combined.push(obs);
        }
        // optimize return
        if (combined.length > 1)
            obs = Rx.Observable.combineLatest(combined, noop).take(1);
        else if (combined.length === 1)
            obs = combined[0].take(1);
        else
            obs = null;
        // no-op return
        return obs ? (obs.subscribe() || Rx.Disposable.empty) : Rx.Disposable.empty;
    }
}
//# sourceMappingURL=View.js.map