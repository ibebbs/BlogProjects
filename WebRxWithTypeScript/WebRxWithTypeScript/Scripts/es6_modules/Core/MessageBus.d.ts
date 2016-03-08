/// <reference path="../Interfaces.d.ts" />
export default class MessageBus implements wx.IMessageBus {
    listen<T>(contract: string): Rx.IObservable<T>;
    isRegistered(contract: string): boolean;
    registerMessageSource<T>(source: Rx.Observable<T>, contract: string): Rx.IDisposable;
    sendMessage<T>(message: T, contract: string): void;
    registerScheduler(scheduler: Rx.IScheduler, contract: string): void;
    private messageBus;
    private schedulerMappings;
    private setupSubjectIfNecessary<T>(contract);
    private getScheduler(contract);
}
