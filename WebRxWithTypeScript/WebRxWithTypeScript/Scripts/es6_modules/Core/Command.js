/// <reference path="../Interfaces.ts" />
import IID from "./../IID";
import { args2Array, isFunction, isRxScheduler, isRxObservable, queryInterface } from "././Utils";
import { injector } from "../Core/Injector";
import * as res from "../Core/Resources";
"use strict";
export class Command {
    /// <summary>
    /// Don't use this directly, use commandXYZ instead
    /// </summary>
    constructor(canExecute, executeAsync, scheduler) {
        this.resultsSubject = new Rx.Subject();
        this.isExecutingSubject = new Rx.Subject();
        this.inflightCount = 0;
        this.canExecuteLatest = false;
        this.scheduler = scheduler || injector.get(res.app).mainThreadScheduler;
        this.func = executeAsync;
        // setup canExecute
        let canExecuteObs = canExecute
            .combineLatest(this.isExecutingSubject.startWith(false), (ce, ie) => ce && !ie)
            .catch(ex => {
            this.exceptionsSubject.onNext(ex);
            return Rx.Observable.return(false);
        })
            .do(x => {
            this.canExecuteLatest = x;
        })
            .startWith(this.canExecuteLatest)
            .distinctUntilChanged()
            .publish();
        this.canExecuteDisp = canExecuteObs.connect();
        this.canExecuteObservable = canExecuteObs;
        // setup thrownExceptions
        this.exceptionsSubject = new Rx.Subject();
        this.thrownExceptions = this.exceptionsSubject.asObservable();
        this.exceptionsSubject
            .observeOn(this.scheduler)
            .subscribe(injector.get(res.app).defaultExceptionHandler);
    }
    //////////////////////////////////
    // IUnknown implementation
    queryInterface(iid) {
        return iid === IID.ICommand || iid === IID.IDisposable;
    }
    //////////////////////////////////
    // IDisposable implementation
    dispose() {
        let disp = this.canExecuteDisp;
        if (disp != null)
            disp.dispose();
    }
    get isExecuting() {
        return this.isExecutingSubject.startWith(this.inflightCount > 0);
    }
    get results() {
        return this.resultsSubject.asObservable();
    }
    canExecute(parameter) {
        return this.canExecuteLatest;
    }
    execute(parameter) {
        this.executeAsync(parameter)
            .catch(Rx.Observable.empty())
            .subscribe();
    }
    executeAsync(parameter) {
        let self = this;
        let ret = this.canExecute(parameter) ? Rx.Observable.create(subj => {
            if (++self.inflightCount === 1) {
                self.isExecutingSubject.onNext(true);
            }
            let decrement = new Rx.SerialDisposable();
            decrement.setDisposable(Rx.Disposable.create(() => {
                if (--self.inflightCount === 0) {
                    self.isExecutingSubject.onNext(false);
                }
            }));
            let disp = self.func(parameter)
                .observeOn(self.scheduler)
                .do(_ => { }, e => decrement.setDisposable(Rx.Disposable.empty), () => decrement.setDisposable(Rx.Disposable.empty))
                .do(x => self.resultsSubject.onNext(x), x => self.exceptionsSubject.onNext(x))
                .subscribe(subj);
            return new Rx.CompositeDisposable(disp, decrement);
        }) : Rx.Observable.throw(new Error("canExecute currently forbids execution"));
        return ret
            .publish()
            .refCount();
    }
}
export var internal;
(function (internal) {
    internal.commandConstructor = Command;
})(internal || (internal = {}));
// factory method implementation
export function command() {
    let args = args2Array(arguments);
    let canExecute;
    let execute;
    let scheduler;
    let thisArg;
    if (isFunction(args[0])) {
        // first overload
        execute = args.shift();
        canExecute = isRxObservable(args[0]) ? args.shift() : Rx.Observable.return(true);
        scheduler = isRxScheduler(args[0]) ? args.shift() : undefined;
        thisArg = args.shift();
        if (thisArg != null)
            execute = execute.bind(thisArg);
        return asyncCommand(canExecute, (parameter) => Rx.Observable.create(obs => {
            try {
                execute(parameter);
                obs.onNext(null);
                obs.onCompleted();
            }
            catch (e) {
                obs.onError(e);
            }
            return Rx.Disposable.empty;
        }), scheduler);
    }
    // second overload
    canExecute = args.shift() || Rx.Observable.return(true);
    scheduler = isRxScheduler(args[0]) ? args.shift() : undefined;
    return new Command(canExecute, x => Rx.Observable.return(x), scheduler);
}
// factory method implementation
export function asyncCommand() {
    let args = args2Array(arguments);
    let canExecute;
    let executeAsync;
    let scheduler;
    let thisArg;
    if (isFunction(args[0])) {
        // second overload
        executeAsync = args.shift();
        scheduler = isRxScheduler(args[0]) ? args.shift() : undefined;
        thisArg = args.shift();
        if (thisArg != null)
            executeAsync = executeAsync.bind(thisArg);
        return new Command(Rx.Observable.return(true), executeAsync, scheduler);
    }
    // first overload
    canExecute = args.shift();
    executeAsync = args.shift();
    scheduler = isRxScheduler(args[0]) ? args.shift() : undefined;
    return new Command(canExecute, executeAsync, scheduler);
}
/**
* Determines if target is an instance of a ICommand
* @param {any} target
*/
export function isCommand(target) {
    if (target == null)
        return false;
    return target instanceof Command ||
        queryInterface(target, IID.ICommand);
}
//# sourceMappingURL=Command.js.map