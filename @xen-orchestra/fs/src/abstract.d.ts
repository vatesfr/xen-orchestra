export default class RemoteHandlerAbstract {
    constructor(remote: any, options?: {});
    _remote: any;
    _timeout: any;
    closeFile: any;
    copy: any;
    getInfo(): Promise<any>;
    getSizeOnDisk(file: any): Promise<any>;
    list: any;
    mkdir: any;
    openFile: any;
    outputFile(file: any, data: any, { dirMode, flags }?: {
        dirMode: any;
        flags?: string;
    }): Promise<void>;
    read(file: any, buffer: any, position: any): Promise<void>;
    readFile: any;
    rename: any;
    rmdir(dir: any): Promise<void>;
    truncate(file: any, len: any): Promise<void>;
    unlink: any;
    write(file: any, buffer: any, position: any): Promise<void>;
    writeFile: any;
    _forget(): Promise<void>;
    _sync(): Promise<void>;
    get type(): void;
    addPrefix(prefix: any): PrefixWrapper | this;
    createReadStream(file: any, { checksum, ignoreMissingChecksum, ...options }?: {
        checksum?: boolean;
        ignoreMissingChecksum?: boolean;
    }): Promise<any>;
    /**
     * write a stream to a file using a temporary file
     *
     * @param {string} path
     * @param {ReadableStream} input
     * @param {object} [options]
     * @param {boolean} [options.checksum]
     * @param {number} [options.dirMode]
     * @param {(this: RemoteHandlerAbstract, path: string) => Promise<undefined>} [options.validator] Function that will be called before the data is commited to the remote, if it fails, file should not exist
     */
    outputStream(path: string, input: ReadableStream, { checksum, dirMode, maxStreamLength, streamLength, validator }?: {
        checksum?: boolean;
        dirMode?: number;
        validator?: (this: RemoteHandlerAbstract, path: string) => Promise<undefined>;
    }): Promise<void>;
    forget(): Promise<void>;
    getSize(file: any): Promise<any>;
    __list(dir: any, { filter, ignoreMissing, prependDir }?: {
        filter: any;
        ignoreMissing?: boolean;
        prependDir?: boolean;
    }): Promise<any>;
    lock(path: any): Promise<{
        dispose: () => Promise<void>;
    }>;
    mktree(dir: any, { mode }?: {
        mode: any;
    }): Promise<void>;
    __readFile(file: any, { flags }?: {
        flags?: string;
    }): Promise<any>;
    __rename(oldPath: any, newPath: any, { checksum }?: {
        checksum?: boolean;
    }): any;
    __copy(oldPath: any, newPath: any, { checksum }?: {
        checksum?: boolean;
    }): Promise<any>;
    rmtree(dir: any): Promise<void>;
    sync(): Promise<void>;
    test(): Promise<{
        success: boolean;
        writeRate: number;
        readRate: number;
        step?: undefined;
        file?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        step: string;
        file: any;
        error: any;
        writeRate?: undefined;
        readRate?: undefined;
    }>;
    __unlink(file: any, { checksum }?: {
        checksum?: boolean;
    }): Promise<void>;
    __writeFile(file: any, data: any, { flags }?: {
        flags?: string;
    }): Promise<void>;
    __closeFile(fd: any): Promise<void>;
    __mkdir(dir: any, { mode }?: {
        mode: any;
    }): Promise<void>;
    __openFile(path: any, flags: any): Promise<{
        fd: any;
        path: any;
    }>;
    useVhdDirectory(): any;
    _closeFile(fd: any): Promise<void>;
    _createOutputStream(file: any, { dirMode, ...options }?: {
        dirMode: any;
    }): any;
    _createReadStream(file: any, options: any): Promise<void>;
    _createWriteStream(file: any, options: any): Promise<void>;
    _getInfo(): Promise<{}>;
    _lock(path: any): Promise<() => Promise<void>>;
    _getSize(file: any): Promise<void>;
    _list(dir: any): Promise<void>;
    _mkdir(dir: any): Promise<void>;
    _mktree(dir: any, { mode }?: {
        mode: any;
    }): any;
    _openFile(path: any, flags: any): Promise<void>;
    _outputFile(file: any, data: any, { dirMode, flags }: {
        dirMode: any;
        flags: any;
    }): any;
    _outputStream(path: any, input: any, { dirMode, validator }: {
        dirMode: any;
        validator: any;
    }): Promise<void>;
    _read(file: any, buffer: any, position: any): void;
    _readFile(file: any, options: any): Promise<void>;
    _rename(oldPath: any, newPath: any): Promise<void>;
    _copy(oldPath: any, newPath: any): Promise<void>;
    _rmdir(dir: any): Promise<void>;
    _rmtree(dir: any): any;
    _unlink(file: any): Promise<void>;
    _write(file: any, buffer: any, position: any): Promise<void>;
    _writeFd(fd: any, buffer: any, position: any): Promise<void>;
    _writeFile(file: any, data: any, options: any): Promise<void>;
    get isEncrypted(): boolean;
    get encryptionAlgorithm(): any;
    #private;
}
declare class PrefixWrapper {
    constructor(handler: any, prefix: any);
    _handler: any;
    get type(): any;
    list(dir: any, opts: any): Promise<any>;
    rename(oldPath: any, newPath: any): any;
    _resolve(path: any): any;
    #private;
}
export {};
