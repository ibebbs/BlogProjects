/// <reference path="../Interfaces.d.ts" />
export declare class Command<T> implements wx.ICommand<T>, wx.IUnknown {
    constructor(canExecute: Rx.Observable<boolean>, executeAsync: (any) => Rx.Observable<T>, scheduler?: Rx.IScheduler);
    queryInterface(iid: string): boolean;
    dispose(): void;
    canExecuteObservable: Rx.Observable<boolean>;
    isExecuting: Rx.Observable<boolean>;
    results: Rx.Observable<T>;
    thrownExceptions: Rx.Observable<Error>;
    canExecute(parameter: any): boolean;
    execute(parameter: any): void;
    executeAsync(parameter?: any): Rx.Observable<T>;
    private func;
    private thisArg;
    private resultsSubject;
    private isExecutingSubject;
    private scheduler;
    private exceptionsSubject;
    private inflightCount;
    private canExecuteLatest;
    private canExecuteDisp;
}
export declare module internal {
    var commandConstructor: any;
}
/**
* Creates a default Command that has a synchronous action.
* @param {(any) => void} execute The action to executed when the command gets invoked
* @param {Rx.Observable<boolean>} canExecute An Observable that determines when the Command can Execute. WhenAny is a great way to create this!
* @param {Rx.IScheduler} scheduler The scheduler to deliver events on. Defaults to App.mainThreadScheduler
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<any>} A Command whose ExecuteAsync just returns the CommandParameter immediately. Which you should ignore!
*/
export declare function command(execute: (any) => void, canExecute?: Rx.Observable<boolean>, scheduler?: Rx.IScheduler, thisArg?: any): wx.ICommand<any>;
/**
* Creates a default Command that has a synchronous action.
* @param {(any) => void} execute The action to executed when the command gets invoked
* @param {Rx.Observable<boolean>} canExecute An Observable that determines when the Command can Execute. WhenAny is a great way to create this!
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<any>} A Command whose ExecuteAsync just returns the CommandParameter immediately. Which you should ignore!
*/
export declare function command(execute: (any) => void, canExecute?: Rx.Observable<boolean>, thisArg?: any): wx.ICommand<any>;
/**
* Creates a default Command that has a synchronous action.
* @param {(any) => void} execute The action to executed when the command gets invoked
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<any>} A Command whose ExecuteAsync just returns the CommandParameter immediately. Which you should ignore!
*/
export declare function command(execute: (any) => void, thisArg?: any): wx.ICommand<any>;
/**
* Creates a default Command that has no background action.
* @param {Rx.Observable<boolean>} canExecute An Observable that determines when the Command can Execute. WhenAny is a great way to create this!
* @param {Rx.IScheduler} scheduler The scheduler to deliver events on. Defaults to App.mainThreadScheduler
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<any>} A Command whose ExecuteAsync just returns the CommandParameter immediately. Which you should ignore!
*/
export declare function command(canExecute?: Rx.Observable<boolean>, scheduler?: Rx.IScheduler): wx.ICommand<any>;
/**
* Creates a Command typed to the given executeAsync Observable method. Use this method if your background method returns Rx.IObservable
* @param {(any) => Rx.Observable<T>} executeAsync Method to call that creates an Observable representing an operation to execute in the background. The Command's canExecute will be false until this Observable completes. If this Observable terminates with OnError, the Exception is marshaled to ThrownExceptions
* @param {Rx.Observable<boolean>} canExecute An Observable that determines when the Command can Execute. WhenAny is a great way to create this!
* @param {Rx.IScheduler} scheduler The scheduler to deliver events on. Defaults to App.mainThreadScheduler
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<T>} A Command which returns all items that are created via calling executeAsync as a single stream.
*/
export declare function asyncCommand<T>(canExecute: Rx.Observable<boolean>, executeAsync: (any) => Rx.Observable<T>, scheduler?: Rx.IScheduler, thisArg?: any): wx.ICommand<T>;
/**
* Creates a Command typed to the given executeAsync Observable method. Use this method if your background method returns Rx.IObservable
* @param {(any) => Rx.Observable<T>} executeAsync Method to call that creates an Observable representing an operation to execute in the background. The Command's canExecute will be false until this Observable completes. If this Observable terminates with OnError, the Exception is marshaled to ThrownExceptions
* @param {Rx.Observable<boolean>} canExecute An Observable that determines when the Command can Execute. WhenAny is a great way to create this!
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<T>} A Command which returns all items that are created via calling executeAsync as a single stream.
*/
export declare function asyncCommand<T>(canExecute: Rx.Observable<boolean>, executeAsync: (any) => Rx.Observable<T>, thisArg?: any): wx.ICommand<T>;
/**
* Creates a Command typed to the given executeAsync Observable method. Use this method if your background method returns Rx.IObservable
* @param {(any) => Rx.Observable<T>} executeAsync Method to call that creates an Observable representing an operation to execute in the background. The Command's canExecute will be false until this Observable completes. If this Observable terminates with OnError, the Exception is marshaled to ThrownExceptions
* @param {Rx.IScheduler} scheduler The scheduler to deliver events on. Defaults to App.mainThreadScheduler
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<T>} A Command which returns all items that are created via calling executeAsync as a single stream.
*/
export declare function asyncCommand<T>(executeAsync: (any) => Rx.Observable<T>, scheduler?: Rx.IScheduler, thisArg?: any): wx.ICommand<T>;
/**
* Creates a Command typed to the given executeAsync Observable method. Use this method if your background method returns Rx.IObservable
* @param {(any) => Rx.Observable<T>} executeAsync Method to call that creates an Observable representing an operation to execute in the background. The Command's canExecute will be false until this Observable completes. If this Observable terminates with OnError, the Exception is marshaled to ThrownExceptions
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<T>} A Command which returns all items that are created via calling executeAsync as a single stream.
*/
export declare function asyncCommand<T>(executeAsync: (any) => Rx.Observable<T>, thisArg?: any): wx.ICommand<T>;
/**
* Determines if target is an instance of a ICommand
* @param {any} target
*/
export declare function isCommand(target: any): boolean;
