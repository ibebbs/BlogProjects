/// <reference path="../Interfaces.ts" />
import { isFunction, throwError, unwrapProperty } from "../Core/Utils";
import { isCommand } from "../Core/Command";
"use strict";
export default class EventBinding {
    constructor(domManager, app) {
        this.priority = 0;
        this.domManager = domManager;
        this.app = app;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("event-binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        // create an observable for each event handler value
        let tokens = this.domManager.getObjectLiteralTokens(options);
        tokens.forEach(token => {
            this.wireEvent(el, token.value, token.key, ctx, state, module);
        });
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
        }));
    }
    configure(options) {
        // intentionally left blank
    }
    wireEvent(el, value, eventName, ctx, state, module) {
        let exp = this.domManager.compileBindingOptions(value, module);
        let command;
        let commandParameter = undefined;
        let obs = Rx.Observable.fromEvent(el, eventName);
        if (typeof exp === "function") {
            let handler = this.domManager.evaluateExpression(exp, ctx);
            handler = unwrapProperty(handler);
            if (isFunction(handler)) {
                state.cleanup.add(obs.subscribe(e => {
                    handler.apply(ctx.$data, [ctx, e]);
                }));
            }
            else {
                if (isCommand(handler)) {
                    command = handler;
                    state.cleanup.add(obs.subscribe(_ => {
                        command.execute(undefined);
                    }));
                }
                else {
                    // assumed to be an Rx.Observer
                    let observer = handler;
                    // subscribe event directly to observer
                    state.cleanup.add(obs.subscribe(observer));
                }
            }
        }
        else if (typeof exp === "object") {
            let opt = exp;
            command = this.domManager.evaluateExpression(opt.command, ctx);
            command = unwrapProperty(command);
            if (exp.hasOwnProperty("parameter"))
                commandParameter = this.domManager.evaluateExpression(opt.parameter, ctx);
            state.cleanup.add(obs.subscribe(_ => {
                try {
                    command.execute(commandParameter);
                }
                catch (e) {
                    this.app.defaultExceptionHandler.onNext(e);
                }
            }));
        }
        else {
            throwError("invalid binding options");
        }
    }
}
//# sourceMappingURL=Event.js.map