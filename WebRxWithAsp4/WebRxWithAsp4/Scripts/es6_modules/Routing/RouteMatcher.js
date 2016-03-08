/// <reference path="../Interfaces.ts" />
import { extend, throwError } from "../Core/Utils";
/*
 * JavaScript Route Matcher
 * http://benalman.com/
 *
 * Copyright (c) 2011 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
"use strict";
// Characters to be escaped with \. RegExp borrowed from the Backbone router
// but escaped (note: unnecessarily) to keep JSHint from complaining.
let reEscape = /[\-\[\]{}()+?.,\\\^$|#\s]/g;
// Match named :param or *splat placeholders.
let reParam = /([:*])(\w+)/g;
export class RouteMatcher {
    // Pass in a route string (or RegExp) plus an optional map of rules, and get
    // back an object with .parse and .stringify methods.
    constructor(route, rules) {
        // store
        this.route = route;
        this.rules = rules;
        // Object to be returned. The public API.
        // Matched param or splat names, in order
        this.params = [];
        // Route matching RegExp.
        let re = route;
        // Build route RegExp from passed string.
        if (typeof route === "string") {
            // Escape special chars.
            re = re.replace(reEscape, "\\$&");
            // Replace any :param or *splat with the appropriate capture group.
            re = re.replace(reParam, (_, mode, name) => {
                this.params.push(name);
                // :param should capture until the next / or EOL, while *splat should
                // capture until the next :param, *splat, or EOL.
                return mode === ":" ? "([^/]*)" : "(.*)";
            });
            // Add ^/$ anchors and create the actual RegExp.
            re = new RegExp("^" + re + "$");
            // Match the passed url against the route, returning an object of params
            // and values.
            this.parse = (url) => {
                let i = 0;
                let param, value;
                let params = {};
                let matches = url.match(re);
                // If no matches, return null.
                if (!matches) {
                    return null;
                }
                // Add all matched :param / *splat values into the params object.
                while (i < this.params.length) {
                    param = this.params[i++];
                    value = matches[i];
                    // If a rule exists for this param and it doesn't validate, return null.
                    if (rules && param in rules && !this.validateRule(rules[param], value)) {
                        return null;
                    }
                    params[param] = value;
                }
                return params;
            };
            // Build path by inserting the given params into the route.
            this.stringify = (params) => {
                params = params || {};
                let param, re;
                let result = route;
                // Insert each passed param into the route string. Note that this loop
                // doesn't check .hasOwnProperty because this script doesn't support
                // modifications to Object.prototype.
                for (param in params) {
                    re = new RegExp("[:*]" + param + "\\b");
                    result = result.replace(re, params[param]);
                }
                // Missing params should be replaced with empty string.
                return result.replace(reParam, "");
            };
        }
        else {
            // RegExp route was passed. This is super-simple.
            this.parse = url => {
                let matches = url.match(re);
                return matches && { captures: matches.slice(1) };
            };
            // There's no meaningful way to stringify based on a RegExp route, so
            // return empty string.
            this.stringify = () => "";
        }
    }
    stripTrailingSlash(route) {
        if (route.length === 0 || route === "/" || route.lastIndexOf("/") !== route.length - 1)
            return route;
        return route.substr(0, route.length - 1);
    }
    get isAbsolute() {
        return this.route.indexOf("/") === 0;
    }
    concat(route) {
        let other = route;
        let a = this.stripTrailingSlash(this.route);
        let b = this.stripTrailingSlash(other.route);
        let rules = null;
        // check for conflicting rules
        if (other.rules) {
            if (this.rules) {
                Object.keys(this.rules).forEach(rule => {
                    if (other.rules.hasOwnProperty(rule)) {
                        throwError("route '{0}' and '{1}' have conflicting rule '{2}", a, b, rule);
                    }
                });
                rules = extend(this.rules, extend(other.rules, {}));
            }
            else {
                rules = extend(other.rules, {});
            }
        }
        else if (this.rules) {
            rules = extend(this.rules, {});
        }
        if (a === "/")
            a = "";
        return new RouteMatcher(a + "/" + b, rules);
    }
    // Test to see if a value matches the corresponding rule.
    validateRule(rule, value) {
        // For a given rule, get the first letter of the string name of its
        // constructor function. "R" -> RegExp, "F" -> Function (these shouldn't
        // conflict with any other types one might specify). Note: instead of
        // getting .toString from a new object {} or Object.prototype, I'm assuming
        // that exports will always be an object, and using its .toString method.
        // Bad idea? Let me know by filing an issue
        let type = this.toString.call(rule).charAt(8);
        // If regexp, match. If function, invoke. Otherwise, compare. Note that ==
        // is used because type coercion is needed, as `value` will always be a
        // string, but `rule` might not.
        return type === "R" ? rule.test(value) : type === "F" ? rule(value) : rule == value;
    }
}
export function route(route, rules) {
    return new RouteMatcher(route, rules);
}
//# sourceMappingURL=RouteMatcher.js.map