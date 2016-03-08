/// <reference path="../Interfaces.ts" />
import { throwError, elementCanBeDisabled } from "../Core/Utils";
import { isCommand } from "../Core/Command";
"use strict";
export default class CommandBinding {
    constructor(domManager, app) {
        this.priority = 0;
        this.domManager = domManager;
        this.app = app;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("command-binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let compiled = this.domManager.compileBindingOptions(options, module);
        let el = node;
        let exp;
        let cmdObservable;
        let paramObservable;
        let cleanup;
        let isAnchor = el.tagName.toLowerCase() === "a";
        let event = "click";
        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }
        if (typeof compiled === "function") {
            exp = compiled;
            cmdObservable = this.domManager.expressionToObservable(exp, ctx);
        }
        else {
            let opt = compiled;
            exp = opt.command;
            cmdObservable = this.domManager.expressionToObservable(exp, ctx);
            if (opt.parameter) {
                exp = opt.parameter;
                paramObservable = this.domManager.expressionToObservable(exp, ctx);
            }
        }
        if (paramObservable == null) {
            paramObservable = Rx.Observable.return(undefined);
        }
        state.cleanup.add(Rx.Observable
            .combineLatest(cmdObservable, paramObservable, (cmd, param) => ({ cmd: cmd, param: param }))
            .subscribe(x => {
            try {
                doCleanup();
                cleanup = new Rx.CompositeDisposable();
                if (x.cmd != null) {
                    if (!isCommand(x.cmd))
                        throwError("Command-Binding only supports binding to a command!");
                    // disabled handling if supported by element
                    if (elementCanBeDisabled(el)) {
                        // initial update
                        el.disabled = !x.cmd.canExecute(x.param);
                        // listen to changes
                        cleanup.add(x.cmd.canExecuteObservable.subscribe(canExecute => {
                            el.disabled = !canExecute;
                        }));
                    }
                    // handle input events
                    cleanup.add(Rx.Observable.fromEvent(el, "click").subscribe((e) => {
                        // verify that the command can actually execute since we cannot disable
                        // all elements - only form elements such as buttons
                        if (x.cmd.canExecute(x.param)) {
                            x.cmd.execute(x.param);
                        }
                        // prevent default for anchors
                        if (isAnchor) {
                            e.preventDefault();
                        }
                    }));
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
            el = null;
            // nullify locals
            doCleanup();
        }));
    }
    configure(options) {
        // intentionally left blank
    }
}
//# sourceMappingURL=Command.js.map