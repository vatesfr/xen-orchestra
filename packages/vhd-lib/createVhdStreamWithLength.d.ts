declare function _exports(stream: any): Promise<EndCutterStream>;
export = _exports;
declare class EndCutterStream {
    constructor(footerOffset: any, footerBuffer: any);
    _footerOffset: any;
    _footerBuffer: any;
    _position: number;
    _done: boolean;
    _transform(data: any, encoding: any, callback: any): void;
}
