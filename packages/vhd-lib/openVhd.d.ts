export function openVhd(handler: any, path: any, opts: any): Promise<{
    dispose: () => void;
    value: VhdDirectory;
} | {
    dispose: () => any;
    value: VhdFile;
}>;
import { VhdDirectory } from "./Vhd/VhdDirectory.js";
import { VhdFile } from "./Vhd/VhdFile.js";
