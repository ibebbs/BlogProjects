/// <reference path="../Interfaces.d.ts" />
/**
 * Registers a CSS-Transition based animation
 * @param {string} prepareTransitionClass The css class(es) to apply before the animation runs.
 * Both prepareTransitionClass and startTransitionClass will be removed automatically from the
 * elements targeted by the animation as soon as the transition has ended.
 * @param {string} startTransitionClass The css class(es) to apply to trigger the transition.
 * @param {string} completeTransitionClass The css class(es) to apply to trigger to the element
 * as soon as the animation has ended.
 * @returns {Rx.Observable<any>} An observable that signals that the animation is complete
 */
export declare function animation(prepareTransitionClass: string | Array<string> | Array<wx.IAnimationCssClassInstruction>, startTransitionClass: string | Array<string> | Array<wx.IAnimationCssClassInstruction>, completeTransitionClass?: string | Array<string> | Array<wx.IAnimationCssClassInstruction>): wx.IAnimation;
/**
 * Registers a scripted animation
 * @param {(element: HTMLElement, params?: any)=> Rx.Observable<any>} run The function that carries out the animation
 * @param {(element: HTMLElement, params?: any)=> void} prepare The function that prepares the targeted elements for the animation
 * @param {(element: HTMLElement, params?: any)=> void} complete The function that performs and cleanup on the targeted elements
 * after the animation has ended
 * @returns {Rx.Observable<any>} An observable that signals that the animation is complete
 */
export declare function animation(run: (element: HTMLElement, params?: any) => Rx.Observable<any>, prepare?: (element: HTMLElement, params?: any) => void, complete?: (element: HTMLElement, params?: any) => void): wx.IAnimation;
