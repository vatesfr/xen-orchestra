export class Task {
    static get cancelToken(): any;
    static run(opts: any, fn: any): any;
    static wrapFn(opts: any, fn: any): (...args: any[]) => any;
    constructor({ name, data, onLog }: {
        name: any;
        data: any;
        onLog: any;
    });
    cancel: any;
    failure(error: any): void;
    info(message: any, data: any): void;
    /**
     * Run a function in the context of this task
     *
     * In case of error, the task will be failed.
     *
     * @typedef Result
     * @param {() => Result} fn
     * @param {boolean} last - Whether the task should succeed if there is no error
     * @returns Result
     */
    run(fn: () => any, last?: boolean): any;
    success(value: any): void;
    warning(message: any, data: any): void;
    wrapFn(fn: any, last: any): () => any;
    #private;
}
