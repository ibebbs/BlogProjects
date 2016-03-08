/// <reference path="../Interfaces.ts" />
import { extend, throwError, isEqual } from "../Core/Utils";
import { property } from "./../Core/Property";
import { route } from "./RouteMatcher";
"use strict";
export class Router {
    constructor(domManager, app) {
        this.current = property();
        //////////////////////////////////
        // Implementation
        this.states = {};
        this.pathSeparator = ".";
        this.parentPathDirective = "^";
        this.rootStateName = "$";
        this.validPathRegExp = /^[a-zA-Z]([\w-_]*$)/;
        this.viewTransitionsSubject = new Rx.Subject();
        this.domManager = domManager;
        this.app = app;
        this.viewTransitions = this.viewTransitionsSubject.asObservable();
        this.reset(false);
        // monitor navigation history
        app.history.onPopState.subscribe((e) => {
            try {
                // certain versions of WebKit raise an empty popstate event on page-load
                if (e && e.state) {
                    let state = e.state;
                    let stateName = state.stateName;
                    if (stateName != null) {
                        // enter state using extracted params
                        this.go(stateName, state.params, { location: false });
                        // update title
                        app.title(state.title);
                    }
                }
            }
            catch (e) {
                app.defaultExceptionHandler.onNext(e);
            }
        });
        if (document) {
            // monitor title changes
            app.title.changed.subscribe(x => {
                document.title = x;
                if (this.current() != null)
                    this.replaceHistoryState(this.current(), x);
            });
        }
    }
    //////////////////////////////////
    // IRouter
    state(config) {
        this.registerStateInternal(config);
        return this;
    }
    updateCurrentStateParams(withParamsAction) {
        let _current = this.current();
        withParamsAction(_current.params);
        this.replaceHistoryState(_current, this.app.title());
    }
    go(to, params, options) {
        to = this.mapPath(to);
        if (this.states[to] == null)
            throwError("state '{0}' is not registered", to);
        this.activateState(to, params, options);
    }
    get(state) {
        return this.states[state];
    }
    is(state, params, options) {
        let _current = this.current();
        let isActive = _current.name === state;
        params = params || {};
        if (isActive) {
            let currentParamsKeys = Object.keys(_current.params);
            let paramsKeys = Object.keys(params);
            if (currentParamsKeys.length === paramsKeys.length) {
                for (let i = 0; i < paramsKeys.length; i++) {
                    if (_current.params[paramsKeys[i]] != params[paramsKeys[i]]) {
                        isActive = false;
                        break;
                    }
                }
            }
            else {
                isActive = false;
            }
        }
        return isActive;
    }
    includes(state, params, options) {
        let _current = this.current();
        let isActive = _current.name.indexOf(state) === 0;
        params = params || {};
        if (isActive) {
            let currentParamsKeys = Object.keys(_current.params);
            let paramsKeys = Object.keys(params);
            paramsKeys = paramsKeys.length <= currentParamsKeys.length ?
                paramsKeys : currentParamsKeys;
            for (let i = 0; i < paramsKeys.length; i++) {
                if (_current.params[paramsKeys[i]] != params[paramsKeys[i]]) {
                    isActive = false;
                    break;
                }
            }
        }
        return isActive;
    }
    url(state, params) {
        state = this.mapPath(state);
        let route = this.getAbsoluteRouteForState(state);
        if (route != null)
            return route.stringify(params);
        return null;
    }
    reset(enterRootState = true) {
        this.states = {};
        // Implicit root state that is always present
        this.root = this.registerStateInternal({
            name: this.rootStateName,
            url: route("/")
        });
        if (enterRootState)
            this.go(this.rootStateName, {}, { location: 2 /* replace */ });
    }
    sync(url) {
        if (url == null)
            url = this.app.history.location.pathname; // + app.history.location.search;
        // iterate over registered states to find matching uri
        let keys = Object.keys(this.states);
        let length = keys.length;
        let params;
        for (let i = 0; i < length; i++) {
            let state = this.states[keys[i]];
            let route = this.getAbsoluteRouteForState(state.name);
            if ((params = route.parse(url)) != null) {
                this.go(state.name, params, { location: 2 /* replace */ });
                return;
            }
        }
        // not found, enter root state as fallback
        if (this.current() == null)
            this.reload();
    }
    reload() {
        let state;
        let params;
        // reload current state or enter inital root state
        if (this.current() != null) {
            state = this.current().name;
            params = this.current().params;
        }
        else {
            state = this.rootStateName;
            params = {};
        }
        this.go(state, params, { force: true, location: 2 /* replace */ });
    }
    getViewComponent(viewName) {
        let _current = this.current();
        let result = undefined;
        if (_current.views != null) {
            let component = _current.views[viewName];
            let stateParams = {};
            if (component != null) {
                result = {};
                if (typeof component === "object") {
                    result.component = component.component;
                    result.params = component.params || {};
                    result.animations = component.animations;
                }
                else {
                    result.component = component;
                    result.params = {};
                    result.animations = undefined;
                }
                // ensure that only parameters configured at state level surface at view-level
                let parameterNames = this.getViewParameterNamesFromStateConfig(viewName, result.component);
                parameterNames.forEach(x => {
                    if (_current.params.hasOwnProperty(x)) {
                        stateParams[x] = _current.params[x];
                    }
                });
                // merge state params into component params
                result.params = extend(stateParams, result.params);
            }
        }
        return result;
    }
    registerStateInternal(state) {
        let parts = state.name.split(this.pathSeparator);
        if (state.name !== this.rootStateName) {
            // validate name
            parts.forEach(path => {
                if (!this.validPathRegExp.test(path)) {
                    throwError("invalid state-path '{0}' (a state-path must start with a character, optionally followed by one or more alphanumeric characters, dashes or underscores)");
                }
            });
        }
        // wrap and store
        state = extend(state, {});
        this.states[state.name] = state;
        if (state.url != null) {
            // create route from string
            if (typeof state.url === "string") {
                state.url = route(state.url);
            }
        }
        else {
            // derive relative route from name
            if (state.name !== this.rootStateName)
                state.url = route(parts[parts.length - 1]);
            else
                state.url = route("/");
        }
        // detect root-state override
        if (state.name === this.rootStateName)
            this.root = state;
        return state;
    }
    pushHistoryState(state, title) {
        let hs = {
            stateName: state.name,
            params: state.params,
            title: title != null ? title : document != null ? document.title : ''
        };
        this.app.history.pushState(hs, "", state.url);
    }
    replaceHistoryState(state, title) {
        let hs = {
            stateName: state.name,
            params: state.params,
            title: title != null ? title : document != null ? document.title : ''
        };
        this.app.history.replaceState(hs, "", state.url);
    }
    mapPath(path) {
        // child-relative
        if (path.indexOf(this.pathSeparator) === 0) {
            return this.current().name + path;
        }
        else if (path.indexOf(this.parentPathDirective) === 0) {
            // parent-relative
            let parent = this.current().name;
            // can't go further up than root
            if (parent === this.rootStateName)
                return parent;
            // test parents and siblings until one is found that is registered
            let parts = parent.split(this.pathSeparator);
            for (let i = parts.length - 1; i > 0; i--) {
                let tmp = parts.slice(0, i).join(this.pathSeparator);
                // check if parent or sibling relative to current parent exists
                if (this.get(tmp) || this.get(tmp + path.substr(1))) {
                    path = tmp + path.substr(1);
                    return path;
                }
            }
            // make it root relative
            path = this.rootStateName + path.substr(1);
            return path;
        }
        return path;
    }
    getStateHierarchy(name) {
        let parts = name.split(this.pathSeparator);
        let stateName = "";
        let result = [];
        let state;
        if (name !== this.rootStateName)
            result.push(this.root);
        for (let i = 0; i < parts.length; i++) {
            if (i > 0)
                stateName += this.pathSeparator + parts[i];
            else
                stateName = parts[i];
            state = this.states[stateName];
            // if not registered, introduce fake state to keep hierarchy intact
            if (state == null) {
                state = {
                    name: stateName,
                    url: route(stateName)
                };
            }
            result.push(state);
        }
        return result;
    }
    getAbsoluteRouteForState(name, hierarchy) {
        hierarchy = hierarchy != null ? hierarchy : this.getStateHierarchy(name);
        let result = null;
        hierarchy.forEach(state => {
            // concat urls
            if (result != null) {
                let route = state.url;
                // individual states may use absolute urls as well
                if (!route.isAbsolute)
                    result = result.concat(state.url);
                else
                    result = route;
            }
            else {
                result = state.url;
            }
        });
        return result;
    }
    activateState(to, params, options) {
        let hierarchy = this.getStateHierarchy(to);
        let stateViews = {};
        let stateParams = {};
        hierarchy.forEach(state => {
            // merge views
            if (state.views != null) {
                extend(state.views, stateViews);
            }
            // merge params
            if (state.params != null) {
                extend(state.params, stateParams);
            }
        });
        // merge param overrides
        if (params) {
            extend(params, stateParams);
        }
        // construct resulting state
        let route = this.getAbsoluteRouteForState(to, hierarchy);
        let state = extend(this.states[to], {});
        state.url = route.stringify(params);
        state.views = stateViews;
        state.params = stateParams;
        // perform deep equal against current state
        let _current = this.current();
        if ((options && options.force) || _current == null ||
            _current.name !== to ||
            !isEqual(_current.params, state.params)) {
            // reset views used by previous state that are unused by new state
            if (_current != null && _current.views != null && state.views != null) {
                Object.keys(_current.views).forEach(x => {
                    if (!state.views.hasOwnProperty(x)) {
                        state.views[x] = null;
                    }
                });
            }
            // update history
            if (options && options.location) {
                if (options.location === 2 /* replace */)
                    this.replaceHistoryState(state, this.app.title());
                else
                    this.pushHistoryState(state, this.app.title());
            }
            if (_current != null) {
                if (_current.onLeave)
                    _current.onLeave(this.get(_current.name), _current.params);
            }
            // activate
            this.current(state);
            if (state.onEnter)
                state.onEnter(this.get(state.name), params);
        }
    }
    getViewParameterNamesFromStateConfig(view, component) {
        let hierarchy = this.getStateHierarchy(this.current().name);
        let stateParams = {};
        let result = [];
        let config;
        let index = -1;
        // walk the hierarchy backward to figure out when the component was introduced at the specified view-slot
        for (let i = hierarchy.length; i--; i >= 0) {
            config = hierarchy[i];
            if (config.views && config.views[view]) {
                let other = config.views[view];
                if (typeof other === "object") {
                    other = other.component;
                }
                if (other === component) {
                    index = i; // found but keep looking
                }
            }
        }
        if (index !== -1) {
            config = hierarchy[index];
            // truncate hierarchy and merge params
            hierarchy = hierarchy.slice(0, index + 1);
            hierarchy.forEach(state => {
                // merge params
                if (state.params != null) {
                    extend(state.params, stateParams);
                }
            });
            // extract resulting property names
            result = Object.keys(stateParams);
            // append any route-params
            result = result.concat(config.url.params);
        }
        return result;
    }
}
//# sourceMappingURL=Router.js.map