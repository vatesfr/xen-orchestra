// schema.js
import { GraphQLObjectType, GraphQLString, GraphQLID, GraphQLSchema, GraphQLList, GraphQLNonNull } from 'graphql'
import { PubSub } from 'graphql-subscriptions'
const pubsub = new PubSub()

const HostType = new GraphQLObjectType({
  name: 'Host',
  fields: {
    uuid: { type: GraphQLID },
    name_label: { type: GraphQLString },
    description: { type: GraphQLString },
  },
})

const VmType = new GraphQLObjectType({
  name: 'Vm',
  fields: {
    uuid: { type: GraphQLID },
    name_label: { type: GraphQLString },
    description: { type: GraphQLString },
    host: {
      type: HostType,
      resolve(parent) {
        return hosts.get(parent.host_uuid)
      },
    },
  },
})
// Your in-memory collection of hosts
const hosts = new Map()

// Add some sample hosts
hosts.set('host_uuid1', { uuid: 'host_uuid1', name_label: 'Host1', description: 'First host' })
hosts.set('host_uuid2', { uuid: 'host_uuid2', name_label: 'Host2', description: 'Second host' })
const vms = new Map()

// Add some sample hosts
vms.set('vm_uuid1', { uuid: 'vm_uuid1', host_uuid: 'host_uuid1', name_label: 'VM1', description: 'First VM' })
vms.set('vm_uuid2', { uuid: 'vm_uuid2', host_uuid: 'host_uuid1', name_label: 'VM2', description: 'Second VM' })
vms.set('vm_uuid3', { uuid: 'vm_uuid3', host_uuid: 'host_uuid2', name_label: 'VM3', description: 'third VM' })

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    vm: {
      type: VmType,
      args: {
        uuid: { type: GraphQLID },
        name_label: { type: GraphQLString },
      },
      resolve(parent, args) {
        if (args.uuid) {
          return vms.get(args.uuid)
        } else if (args.name_label) {
          return Array.from(vms.values()).find(vm => vm.name_label === args.name_label)
        }
        return null
      },
    },
    vms: {
      type: new GraphQLList(VmType),
      resolve() {
        return Array.from(vms.values())
      },
    },
    host: {
      type: HostType,
      args: { uuid: { type: GraphQLID } },
      resolve(parent, args) {
        return hosts.get(args.uuid)
      },
    },
  },
})
/*
const RootMutation = new GraphQLObjectType({
    name: 'RootMutationType',
    fields: {
        // Add mutations to update VMs if needed
    },
});
*/

const RootSubscription = new GraphQLObjectType({
  name: 'RootSubscriptionType',
  fields: {
    vmUpdated: {
      type: VmType,
      args: { uuid: { type: new GraphQLNonNull(GraphQLID) } },
      subscribe: (parent, { uuid }) => pubsub.asyncIterator(`VM_UPDATED_${uuid}`),
      resolve: payload => payload,
    },
  },
})

export default new GraphQLSchema({
  query: RootQuery,
  //  mutation: RootMutation,
  subscription: RootSubscription,
})
