import type { XoUser } from "@vates/types";
import type { AnyPrivilege } from "@xen-orchestra/acl";

export type PrivilegesChange = { user: XoUser; userPrivileges: AnyPrivilege[]; previousUserPrivileges: AnyPrivilege[] }
