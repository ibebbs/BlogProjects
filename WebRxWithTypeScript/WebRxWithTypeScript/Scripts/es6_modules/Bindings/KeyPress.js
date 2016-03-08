/// <reference path="../Interfaces.ts" />
import { throwError, unwrapProperty } from "../Core/Utils";
import { isCommand } from "../Core/Command";
"use strict";
const keysByCode = {
    8: 'backspace',
    9: 'tab',
    13: 'enter',
    27: 'esc',
    32: 'space',
    33: 'pageup',
    34: 'pagedown',
    35: 'end',
    36: 'home',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    45: 'insert',
    46: 'delete'
};
export default class KeyPressBinding {
    constructor(domManager, app) {
        this.priority = 0;
        this.domManager = domManager;
        this.app = app;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("keyPress-binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        // create an observable for key combination
        let tokens = this.domManager.getObjectLiteralTokens(options);
        let obs = Rx.Observable.fromEvent(el, "keydown")
            .where(x => !x.repeat)
            .publish()
            .refCount();
        tokens.forEach(token => {
            let keyDesc = token.key;
            let combination, combinations = [];
            // parse key combinations
            keyDesc.split(' ').forEach(variation => {
                combination = {
                    expression: keyDesc,
                    keys: {}
                };
                variation.split('-').forEach(value => {
                    combination.keys[value.trim()] = true;
                });
                combinations.push(combination);
            });
            this.wireKey(token.value, obs, combinations, ctx, state, module);
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
    testCombination(combination, event) {
        let metaPressed = !!(event.metaKey && !event.ctrlKey);
        let altPressed = !!event.altKey;
        let ctrlPressed = !!event.ctrlKey;
        let shiftPressed = !!event.shiftKey;
        let keyCode = event.keyCode;
        let metaRequired = !!combination.keys.meta;
        let altRequired = !!combination.keys.alt;
        let ctrlRequired = !!combination.keys.ctrl;
        let shiftRequired = !!combination.keys.shift;
        // normalize keycodes
        if ((!shiftPressed || shiftRequired) && keyCode >= 65 && keyCode <= 90)
            keyCode = keyCode + 32;
        let mainKeyPressed = combination.keys[keysByCode[keyCode]] || combination.keys[keyCode.toString()] || combination.keys[String.fromCharCode(keyCode)];
        return (mainKeyPressed &&
            (metaRequired === metaPressed) &&
            (altRequired === altPressed) &&
            (ctrlRequired === ctrlPressed) &&
            (shiftRequired === shiftPressed));
    }
    testCombinations(combinations, event) {
        for (let i = 0; i < combinations.length; i++) {
            if (this.testCombination(combinations[i], event))
                return true;
        }
        return false;
    }
    wireKey(value, obs, combinations, ctx, state, module) {
        let exp = this.domManager.compileBindingOptions(value, module);
        let command;
        let commandParameter = undefined;
        if (typeof exp === "function") {
            let handler = this.domManager.evaluateExpression(exp, ctx);
            handler = unwrapProperty(handler);
            if (!isCommand(handler)) {
                state.cleanup.add(obs.where(e => this.testCombinations(combinations, e)).subscribe(e => {
                    try {
                        handler.apply(ctx.$data, [ctx]);
                        e.preventDefault();
                    }
                    catch (e) {
                        this.app.defaultExceptionHandler.onNext(e);
                    }
                }));
            }
            else {
                command = handler;
                state.cleanup.add(obs.where(e => this.testCombinations(combinations, e)).subscribe(e => {
                    try {
                        command.execute(undefined);
                        e.preventDefault();
                    }
                    catch (e) {
                        this.app.defaultExceptionHandler.onNext(e);
                    }
                }));
            }
        }
        else if (typeof exp === "object") {
            command = this.domManager.evaluateExpression(exp.command, ctx);
            command = unwrapProperty(command);
            if (exp.hasOwnProperty("parameter"))
                commandParameter = this.domManager.evaluateExpression(exp.parameter, ctx);
            state.cleanup.add(obs.where(e => this.testCombinations(combinations, e)).subscribe(e => {
                try {
                    command.execute(commandParameter);
                    e.preventDefault();
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
//# sourceMappingURL=KeyPress.js.map