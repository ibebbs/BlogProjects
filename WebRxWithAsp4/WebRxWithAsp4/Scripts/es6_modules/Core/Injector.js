/// <reference path="../Interfaces.ts" />
import { extend, isFunction, throwError } from "../Core/Utils";
import * as res from "./Resources";
"use strict";
/**
* Simple IoC & Service Locator
*/
class Injector {
    constructor() {
        //////////////////////////////////
        // Implementation
        this.registrations = {};
    }
    register() {
        let key = arguments[0];
        let val = arguments[1];
        let isSingleton = arguments[2];
        let factory;
        if (this.registrations.hasOwnProperty(key))
            throwError("'{0}' is already registered", key);
        if (isFunction(val)) {
            // second overload
            // it's a factory function
            factory = (args, deps) => val.apply(null, args);
        }
        else if (Array.isArray(val)) {
            // first overload
            // array assumed to be inline array notation with constructor
            let self = this;
            let ctor = val.pop();
            let dependencies = val;
            factory = (args, deps) => {
                // resolve dependencies
                let resolved = dependencies.map(x => {
                    try {
                        return self.get(x, undefined, deps);
                    }
                    catch (e) {
                        return throwError("Error resolving dependency '{0}' for '{1}': {2}", x, key, e);
                    }
                });
                // invoke constructor
                let _args = [null].concat(resolved).concat(args);
                let ctorFunc = ctor.bind.apply(ctor, _args);
                return new ctorFunc();
            };
        }
        else {
            // third overload
            // singleton
            factory = (args, deps) => val;
        }
        this.registrations[key] = { factory: factory, isSingleton: isSingleton };
        return this;
    }
    get(key, args, deps) {
        deps = deps || {};
        if (deps.hasOwnProperty(key))
            throwError("Detected circular dependency a from '{0}' to '{1}'", Object.keys(deps).join(", "), key);
        // registered?
        let registration = this.registrations[key];
        if (registration === undefined)
            throwError("'{0}' is not registered", key);
        // already instantiated?
        if (registration.isSingleton && registration.value)
            return registration.value;
        // append current key
        let newDeps = {};
        newDeps[key] = true;
        extend(deps, newDeps);
        // create it
        let result = registration.factory(args, newDeps);
        // cache if singleton
        if (registration.isSingleton)
            registration.value = result;
        return result;
    }
    resolve(iaa, args) {
        let ctor = iaa.pop();
        if (!isFunction(ctor))
            throwError("Error resolving inline-annotated-array. Constructor must be of type 'function' but is '{0}", typeof ctor);
        let self = this;
        // resolve dependencies
        let resolved = iaa.map(x => {
            try {
                return self.get(x, undefined, iaa);
            }
            catch (e) {
                return throwError("Error resolving dependency '{0}' for '{1}': {2}", x, Object.getPrototypeOf(ctor), e);
            }
        });
        // invoke constructor
        let _args = [null].concat(resolved).concat(args);
        let ctorFunc = ctor.bind.apply(ctor, _args);
        return new ctorFunc();
    }
}
export var injector = new Injector();
injector.register(res.injector, () => new Injector());
//# sourceMappingURL=Injector.js.map