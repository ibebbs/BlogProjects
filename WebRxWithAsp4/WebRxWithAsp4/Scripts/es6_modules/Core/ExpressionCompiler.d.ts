/// <reference path="../Interfaces.d.ts" />
/**
* Split an object-literal string into tokens (borrowed from the KnockoutJS project)
* @param {string} objectLiteralString A javascript-style object literal without leading and trailing curly brances
* @return {Command<any>} A Command whose ExecuteAsync just returns the CommandParameter immediately. Which you should ignore!
*/
export declare function parseObjectLiteral(objectLiteralString: any): Array<wx.IObjectLiteralToken>;
export declare function getRuntimeHooks(locals: any): wx.ICompiledExpressionRuntimeHooks;
export declare function setRuntimeHooks(locals: any, hooks: wx.ICompiledExpressionRuntimeHooks): void;
/**
 * Compiles src and returns a function that executes src on a target object.
 * The compiled function is cached under compile.cache[src] to speed up further calls.
 *
 * @param {string} src
 * @returns {function}
 */
export declare function compileExpression(src: string, options?: wx.IExpressionCompilerOptions, cache?: {
    [exp: string]: wx.ICompiledExpression;
}): wx.ICompiledExpression;
