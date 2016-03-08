/// <reference path="../Interfaces.ts" />
import { args2Array, throwError, nodeListToArray, toggleCssClass, noop } from "../Core/Utils";
"use strict";
function toElementList(element) {
    let nodes;
    if (element instanceof Node || element instanceof HTMLElement)
        nodes = [element];
    else if (Array.isArray(element))
        nodes = element;
    else if (element instanceof NodeList)
        nodes = nodeListToArray(element);
    else
        throwError("invalid argument: element");
    let elements = nodes.filter(x => x.nodeType === 1);
    return elements;
}
function parseTimingValue(x) {
    // it's always safe to consider only second values and omit `ms` values since
    // getComputedStyle will always handle the conversion for us
    if (x.charAt(x.length - 1) === "s") {
        x = x.substring(0, x.length - 1);
    }
    let value = parseFloat(x) || 0;
    return value;
}
function getMaximumTransitionDuration(el) {
    let str = getComputedStyle(el)["transitionDuration"];
    let maxValue = 0;
    let values = str.split(/\s*,\s*/);
    values.forEach(x => {
        let value = parseTimingValue(x);
        maxValue = maxValue ? Math.max(value, maxValue) : value;
    });
    return maxValue * 1000;
}
function getMaximumTransitionDelay(el) {
    let str = getComputedStyle(el)["transitionDelay"];
    let maxValue = 0;
    let values = str.split(/\s*,\s*/);
    values.forEach(x => {
        let value = Math.max(0, parseTimingValue(x));
        maxValue = maxValue ? Math.max(value, maxValue) : value;
    });
    return maxValue * 1000;
}
function getKeyframeAnimationDuration(el) {
    let durationStr = getComputedStyle(el)["animationDuration"] || getComputedStyle(el)["webkitAnimationDuration"] || "0s";
    let delayStr = getComputedStyle(el)["animationDelay"] || getComputedStyle(el)["webkitAnimationDelay"] || "0s";
    let duration = parseTimingValue(durationStr);
    let delay = parseTimingValue(delayStr);
    return (duration + delay) * 1000;
}
function scriptedAnimation(run, prepare, complete) {
    let result = {};
    if (prepare) {
        result.prepare = (nodes, params) => {
            let elements = toElementList(nodes);
            elements.forEach(x => prepare(x, params));
        };
    }
    else {
        result.prepare = noop;
    }
    result.run = (nodes, params) => {
        return Rx.Observable.defer(() => {
            let elements = toElementList(nodes);
            if (elements.length === 0)
                return Rx.Observable.return(undefined);
            return Rx.Observable.combineLatest(elements.map(x => run(x, params)), noop);
        });
    };
    if (complete) {
        result.complete = (nodes, params) => {
            let elements = toElementList(nodes);
            elements.forEach(x => complete(x, params));
        };
    }
    else {
        result.complete = noop;
    }
    return result;
}
function cssTransitionAnimation(prepare, run, complete) {
    let result = {};
    let prepToAdd;
    let prepToRemove;
    let runToAdd;
    let runToRemove;
    let completeToAdd;
    let completeToRemove;
    if (prepare) {
        let prepIns;
        if (typeof prepare === "string") {
            prepare = prepare.split(/\s+/).map(x => x.trim()).filter(x => x);
        }
        if (typeof prepare[0] === "string") {
            // convert into wx.IAnimationCssClassInstruction
            prepIns = prepare.map(x => ({ css: x, add: true }));
        }
        else {
            prepIns = prepare;
        }
        prepToAdd = prepIns.filter(x => x.add).map(x => x.css);
        prepToRemove = prepIns.filter(x => !x.add || x.remove).map(x => x.css);
        result.prepare = (nodes, params) => {
            let elements = toElementList(nodes);
            if (prepToAdd && prepToAdd.length)
                elements.forEach(x => toggleCssClass.apply(null, [x, true].concat(prepToAdd)));
            if (prepToRemove && prepToRemove.length)
                elements.forEach(x => toggleCssClass.apply(null, [x, false].concat(prepToRemove)));
        };
    }
    let runIns;
    if (typeof run === "string") {
        run = run.split(/\s+/).map(x => x.trim()).filter(x => x);
    }
    if (typeof run[0] === "string") {
        // convert into wx.IAnimationCssClassInstruction
        runIns = run.map(x => ({ css: x, add: true }));
    }
    else {
        runIns = run;
    }
    runToAdd = runIns.filter(x => x.add).map(x => x.css);
    runToRemove = runIns.filter(x => !x.add || x.remove).map(x => x.css);
    result.run = (nodes, params) => {
        return Rx.Observable.defer(() => {
            let elements = toElementList(nodes);
            if (elements.length === 0)
                return Rx.Observable.return(undefined);
            let obs = Rx.Observable.combineLatest(elements.map(x => {
                let duration = Math.max(getMaximumTransitionDuration(x) + getMaximumTransitionDelay(x), getKeyframeAnimationDuration(x));
                return Rx.Observable.timer(duration);
            }), noop);
            // defer animation-start to avoid problems with transitions on freshly added elements
            Rx.Observable.timer(1).subscribe(() => {
                if (runToAdd && runToAdd.length)
                    elements.forEach(x => toggleCssClass.apply(null, [x, true].concat(runToAdd)));
                if (runToRemove && runToRemove.length)
                    elements.forEach(x => toggleCssClass.apply(null, [x, false].concat(runToRemove)));
            });
            return obs;
        });
    };
    let completeIns;
    if (complete) {
        if (typeof complete === "string") {
            complete = complete.split(/\s+/).map(x => x.trim()).filter(x => x);
        }
        if (typeof complete[0] === "string") {
            // convert into wx.IAnimationCssClassInstruction
            completeIns = complete.map(x => ({ css: x, add: true }));
        }
        else {
            completeIns = complete;
        }
        completeToAdd = completeIns.filter(x => x.add).map(x => x.css);
        completeToRemove = completeIns.filter(x => !x.add || x.remove).map(x => x.css);
    }
    else {
        // default to remove classes added during prepare & run stages
        completeToRemove = [];
        if (prepToAdd && prepToAdd.length)
            completeToRemove = completeToRemove.concat(prepToAdd);
        if (runToAdd && runToAdd.length)
            completeToRemove = completeToRemove.concat(runToAdd);
    }
    result.complete = (nodes, params) => {
        let elements = toElementList(nodes);
        if (completeToAdd && completeToAdd.length)
            elements.forEach(x => toggleCssClass.apply(null, [x, true].concat(completeToAdd)));
        if (completeToRemove && completeToRemove.length)
            elements.forEach(x => toggleCssClass.apply(null, [x, false].concat(completeToRemove)));
    };
    return result;
}
export function animation() {
    let args = args2Array(arguments);
    let val = args.shift();
    if (typeof val === "function") {
        return scriptedAnimation(val, args.shift(), args.shift());
    }
    return cssTransitionAnimation(val, args.shift(), args.shift());
}
//# sourceMappingURL=Animation.js.map