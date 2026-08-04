declare module '@vates/read-chunk' {
    export function readChunkStrict(stream:ReadableStream, size:number): Promise<Buffer>
} 
