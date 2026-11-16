// A VIF on a network with a VLAN is an access port, and XAPI refuses `trunks` there
// (NETWORK_INCOMPATIBLE_WITH_TRUNKS): callers decide whether to refuse the request or to drop the trunks.
//
// `network` is a XAPI object (`$PIFs` resolved), whose `VLAN` is a raw record field, a string over XML-RPC: it
// has to be coerced before the comparison
export default network => network.$PIFs.some(pif => +pif.VLAN !== -1)
