/// <reference path="./Interfaces.ts" />
import { injector } from "./Core/Injector";
import { isInUnitTest } from "./Core/Utils";
import * as res from "./Core/Resources";
import * as log from "./Core/Log";
import { property } from "./Core/Property";
import { Module, modules } from "./Core/Module";
import * as ExpressionCompiler from "./Core/ExpressionCompiler";
import { DomManager } from "./Core/DomManager";
import HtmlTemplateEngine from "./Core/HtmlTemplateEngine";
import CommandBinding from "./Bindings/Command";
import ModuleBinding from "./Bindings/Module";
import { IfBinding, NotIfBinding } from "./Bindings/If";
import { AttrBinding, CssBinding, StyleBinding } from "./Bindings/MultiOneWay";
import { DisableBinding, EnableBinding, HiddenBinding, VisibleBinding, HtmlBinding, TextBinding } from "./Bindings/SingleOneWay";
import ForEachBinding from "./Bindings/ForEach";
import EventBinding from "./Bindings/Event";
import ValueBinding from "./Bindings/Value";
import HasFocusBinding from "./Bindings/HasFocus";
import WithBinding from "./Bindings/With";
import CheckedBinding from "./Bindings/Checked";
import KeyPressBinding from "./Bindings/KeyPress";
import TextInputBinding from "./Bindings/TextInput";
import SelectedValueBinding from "./Bindings/SelectedValue";
import ComponentBinding from "./Bindings/Component";
import StateActiveBinding from "./Routing/Bindings/StateActive";
import ViewBinding from "./Routing/Bindings/View";
import StateRefBinding from "./Routing/Bindings/StateRef";
import SimpleBinding from "./Bindings/Simple";
import SelectComponent from "./Components/Select";
import RadioGroupComponent from "./Components/RadioGroup";
import { Router } from "./Routing/Router";
import MessageBus from "./Core/MessageBus";
import HttpClient from "./Core/HttpClient";
import { version } from "./Version";
import { install } from "./RxExtensions";
install();
"use strict";
class App extends Module {
    constructor() {
        super("app");
        /// <summary>
        /// This Observer is signalled whenever an object that has a
        /// ThrownExceptions property doesn't Subscribe to that Observable. Use
        /// Observer.create to set up what will happen.
        /// </summary>
        this.defaultExceptionHandler = Rx.Observer.create(ex => {
        });
        this.title = property(document != null ? document.title : '');
        this.version = version;
        if (window) {
            if (!isInUnitTest()) {
                this.history = this.createHistory();
            }
            else {
                this.history = window["createMockHistory"]();
            }
        }
    }
    /// <summary>
    /// MainThreadScheduler is the scheduler used to schedule work items that
    /// should be run "on the UI thread". In normal mode, this will be
    /// DispatcherScheduler, and in Unit Test mode this will be Immediate,
    /// to simplify writing common unit tests.
    /// </summary>
    get mainThreadScheduler() {
        return this._unitTestMainThreadScheduler || this._mainThreadScheduler
            || Rx.Scheduler.currentThread; // OW: return a default if schedulers haven't been setup by in
    }
    set mainThreadScheduler(value) {
        if (isInUnitTest()) {
            this._unitTestMainThreadScheduler = value;
            this._mainThreadScheduler = this._mainThreadScheduler || value;
        }
        else {
            this._mainThreadScheduler = value;
        }
    }
    get templateEngine() {
        if (!this._templateEngine) {
            this._templateEngine = injector.get(res.templateEngine);
        }
        return this._templateEngine;
    }
    set templateEngine(newVal) {
        this._templateEngine = newVal;
    }
    get router() {
        if (!this._router) {
            this._router = injector.get(res.router);
        }
        return this._router;
    }
    devModeEnable() {
        // configure logging
        log.hintEnable = true;
        // wire exception logging
        this.defaultExceptionHandler = Rx.Observer.create(ex => {
            log.error("An onError occurred on an object (usually a computedProperty) that would break a binding or command. To prevent this, subscribe to the thrownExceptions property of your objects: {0}", ex);
        });
    }
    createHistory() {
        // inherit default implementation
        let result = {
            back: window.history.back.bind(window.history),
            forward: window.history.forward.bind(window.history),
            //go: window.history.go,
            getSearchParameters: (query) => {
                query = query || result.location.search.substr(1);
                if (query) {
                    let result = {};
                    let params = query.split("&");
                    for (var i = 0; i < params.length; i++) {
                        var tmp = params[i].split("=");
                        result[tmp[0]] = decodeURIComponent(tmp[1]);
                    }
                    return result;
                }
                return {};
            }
        };
        if (window.history.pushState) {
            result.pushState = window.history.pushState.bind(window.history);
        }
        if (window.history.replaceState) {
            result.replaceState = window.history.pushState.bind(window.history);
        }
        Object.defineProperty(result, "length", {
            get() {
                return window.history.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(result, "state", {
            get() {
                return window.history.state;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(result, "location", {
            get() {
                return window.location;
            },
            enumerable: true,
            configurable: true
        });
        // enrich with observable
        result.onPopState = Rx.Observable.fromEventPattern((h) => window.addEventListener("popstate", h), (h) => window.removeEventListener("popstate", h))
            .publish()
            .refCount();
        return result;
    }
    register() {
        injector.register(res.app, this) // register with injector
            .register(res.expressionCompiler, ExpressionCompiler)
            .register(res.templateEngine, [HtmlTemplateEngine], true)
            .register(res.domManager, [res.expressionCompiler, res.app, DomManager], true)
            .register(res.router, [res.domManager, res.app, Router], true)
            .register(res.messageBus, [MessageBus], true)
            .register(res.httpClient, [HttpClient], false);
        injector.register("bindings.module", [res.domManager, res.app, ModuleBinding], true)
            .register("bindings.command", [res.domManager, res.app, CommandBinding], true)
            .register("bindings.if", [res.domManager, res.app, IfBinding], true)
            .register("bindings.with", [res.domManager, res.app, WithBinding], true)
            .register("bindings.notif", [res.domManager, res.app, NotIfBinding], true)
            .register("bindings.css", [res.domManager, res.app, CssBinding], true)
            .register("bindings.attr", [res.domManager, res.app, AttrBinding], true)
            .register("bindings.style", [res.domManager, res.app, StyleBinding], true)
            .register("bindings.text", [res.domManager, res.app, TextBinding], true)
            .register("bindings.html", [res.domManager, res.app, HtmlBinding], true)
            .register("bindings.visible", [res.domManager, res.app, VisibleBinding], true)
            .register("bindings.hidden", [res.domManager, res.app, HiddenBinding], true)
            .register("bindings.enabled", [res.domManager, res.app, EnableBinding], true)
            .register("bindings.disabled", [res.domManager, res.app, DisableBinding], true)
            .register("bindings.foreach", [res.domManager, res.app, ForEachBinding], true)
            .register("bindings.event", [res.domManager, res.app, EventBinding], true)
            .register("bindings.keyPress", [res.domManager, res.app, KeyPressBinding], true)
            .register("bindings.textInput", [res.domManager, res.app, TextInputBinding], true)
            .register("bindings.checked", [res.domManager, res.app, CheckedBinding], true)
            .register("bindings.selectedValue", [res.domManager, res.app, SelectedValueBinding], true)
            .register("bindings.component", [res.domManager, res.app, ComponentBinding], true)
            .register("bindings.value", [res.domManager, res.app, ValueBinding], true)
            .register("bindings.hasFocus", [res.domManager, res.app, HasFocusBinding], true)
            .register("bindings.view", [res.domManager, res.router, res.app, ViewBinding], true)
            .register("bindings.sref", [res.domManager, res.router, res.app, StateRefBinding], true)
            .register("bindings.sactive", [res.domManager, res.router, res.app, StateActiveBinding], true)
            .register("bindings.simple", [res.domManager, res.app, SimpleBinding], false);
        injector.register("components.radiogroup", [res.templateEngine, RadioGroupComponent])
            .register("components.select", [res.templateEngine, SelectComponent]);
        // initialize module
        this.binding("module", "bindings.module")
            .binding("css", "bindings.css")
            .binding("attr", "bindings.attr")
            .binding("style", "bindings.style")
            .binding("command", "bindings.command")
            .binding("if", "bindings.if")
            .binding("with", "bindings.with")
            .binding("ifnot", "bindings.notif")
            .binding("text", "bindings.text")
            .binding("html", "bindings.html")
            .binding("visible", "bindings.visible")
            .binding("hidden", "bindings.hidden")
            .binding("disabled", "bindings.disabled")
            .binding("enabled", "bindings.enabled")
            .binding("foreach", "bindings.foreach")
            .binding("event", "bindings.event")
            .binding(["keyPress", "keypress"], "bindings.keyPress")
            .binding(["textInput", "textinput"], "bindings.textInput")
            .binding("checked", "bindings.checked")
            .binding("selectedValue", "bindings.selectedValue")
            .binding("component", "bindings.component")
            .binding("value", "bindings.value")
            .binding(["hasFocus", "hasfocus"], "bindings.hasFocus")
            .binding("view", "bindings.view")
            .binding(["sref", "stateRef", "stateref"], "bindings.sref")
            .binding(["sactive", "stateActive", "stateactive"], "bindings.sactive");
        this.component("wx-radiogroup", { resolve: "components.radiogroup" })
            .component("wx-select", { resolve: "components.select" });
        // register with module-registry
        modules["app"] = { instance: this };
    }
}
let _app = new App();
export var app = _app;
_app.register();
export var router = injector.get(res.router);
export var messageBus = injector.get(res.messageBus);
//# sourceMappingURL=App.js.map