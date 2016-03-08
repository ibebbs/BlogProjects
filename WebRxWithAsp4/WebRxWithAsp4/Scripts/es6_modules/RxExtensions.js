/// <reference path="./Interfaces.ts" />
import { args2Array, isFunction, throwError, isRxObservable } from "./Core/Utils";
import IID from "./IID";
import { createScheduledSubject } from "./Core/ScheduledSubject";
import { injector } from "./Core/Injector";
import * as res from "./Core/Resources";
"use strict";
let RxObsConstructor = Rx.Observable; // this hack is neccessary because the .d.ts for RxJs declares Observable as an interface)
/**
* Creates an read-only observable property with an optional default value from the current (this) observable
* (Note: This is the equivalent to Knockout's ko.computed)
* @param {T} initialValue? Optional initial value, valid until the observable produces a value
*/
function toProperty(initialValue, scheduler) {
    scheduler = scheduler || Rx.Scheduler.currentThread;
    // initialize accessor function (read-only)
    let accessor = function propertyAccessor(newVal) {
        if (arguments.length > 0) {
            throwError("attempt to write to a read-only observable property");
        }
        return accessor.value;
    };
    //////////////////////////////////
    // IUnknown implementation
    accessor.queryInterface = (iid) => {
        return iid === IID.IObservableReadOnlyProperty || IID.IObservableProperty || iid === IID.IDisposable;
    };
    //////////////////////////////////
    // IDisposable implementation
    accessor.dispose = () => {
        if (accessor.sub) {
            accessor.sub.dispose();
            accessor.sub = null;
        }
    };
    //////////////////////////////////
    // IObservableReadOnlyProperty<T> implementation
    accessor.value = initialValue;
    // setup observables
    accessor.changedSubject = new Rx.Subject();
    accessor.changed = accessor.changedSubject.asObservable();
    accessor.changingSubject = new Rx.Subject();
    accessor.changing = accessor.changingSubject.asObservable();
    accessor.source = this;
    accessor.thrownExceptions = createScheduledSubject(scheduler, injector.get(res.app).defaultExceptionHandler);
    accessor.catchExceptions = (onError) => {
        accessor.thrownExceptions.subscribe((e) => {
            onError(e);
        });
        return accessor;
    };
    //////////////////////////////////
    // implementation
    let firedInitial = false;
    accessor.sub = this
        .distinctUntilChanged()
        .subscribe(x => {
        // Suppress a non-change between initialValue and the first value
        // from a Subscribe
        if (firedInitial && x === accessor.value) {
            return;
        }
        firedInitial = true;
        accessor.changingSubject.onNext(x);
        accessor.value = x;
        accessor.changedSubject.onNext(x);
    }, x => accessor.thrownExceptions.onNext(x));
    return accessor;
}
RxObsConstructor.prototype.toProperty = toProperty;
RxObsConstructor.prototype.continueWith = function () {
    let args = args2Array(arguments);
    let val = args.shift();
    let obs = undefined;
    if (isRxObservable(val)) {
        obs = val;
    }
    else if (isFunction(val)) {
        let action = val;
        obs = Rx.Observable.startDeferred(action);
    }
    return this.selectMany(_ => obs);
};
function invokeCommand(command) {
    // see the ReactiveUI project for the inspiration behind this function:
    // https://github.com/reactiveui/ReactiveUI/blob/master/ReactiveUI/ReactiveCommand.cs#L511
    return this
        .select(x => ({
        parameter: x,
        command: (command instanceof Function ? command() : command)
    }))
        .debounce(x => x.command.canExecuteObservable.startWith(x.command.canExecute(x.parameter)).where(b => b).select(x => 0))
        .select(x => x.command.executeAsync(x.parameter).catch(Rx.Observable.empty()))
        .switch()
        .subscribe();
}
RxObsConstructor.prototype.invokeCommand = invokeCommand;
RxObsConstructor.startDeferred = (action) => {
    return Rx.Observable.defer(() => {
        return Rx.Observable.create(observer => {
            let cancelled = false;
            if (!cancelled)
                action();
            observer.onNext(undefined);
            observer.onCompleted();
            return Rx.Disposable.create(() => cancelled = true);
        });
    });
};
export function install() {
    // deliberately left blank
}
//# sourceMappingURL=RxExtensions.js.map