import { useTaskStore } from '@/stores/xo-rest-api/task.store'
import { convertTaskToCore } from '@/utils/convert-task-to-core.util.ts'
import type { TreeNodeDefinition } from '@core/composables/tree/types.ts'
import type { Task } from '@core/types/task.type.ts'
import { defineTree } from '@core/composables/tree/define-tree'
import { useTreeFilter } from '@core/composables/tree-filter.composable'
import { useTree } from '@core/composables/tree.composable'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

const mockedTasks = [
  {
    id: '0m7op3ssj',
    properties: {
      // poolId: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
      // poolName: 'XCP 8.3.0 XO Team',
      progress: 44,
      type: 'xo:authentication:authenticateUser',
      name: 'Rolling pool reboot',
      userId: '0ea53763-758a-4549-abdc-7571f8dd0cf1',
    },
    start: 1740742442371,
    status: 'failure',
    updatedAt: 1740742985404,
    tasks: [
      {
        id: 'sgwzdra04y',
        properties: {
          name: 'Restarting hosts',
          progress: 67,
        },
        start: 1740742442499,
        status: 'failure',
        tasks: [
          {
            id: 'siiwnbtdyed',
            properties: {
              name: 'Restarting host b61a5c92-700e-4966-a13b-00633f03eea8',
              hostId: 'b61a5c92-700e-4966-a13b-00633f03eea8',
              hostName: 'XCP XO 8.3.0 master',
            },
            start: 1740742442500,
            status: 'success',
            tasks: [
              {
                id: 'kurl6d798i',
                properties: {
                  name: 'Evacuate',
                  hostId: 'b61a5c92-700e-4966-a13b-00633f03eea8',
                  hostName: 'XCP XO 8.3.0 master',
                },
                start: 1740742442586,
                status: 'success',
                end: 1740742442798,
              },
              {
                id: 'umedfyfm41o',
                errors: [{ message: 'Restarting Error' }],
                warnings: [
                  { message: 'Restarting Warning' },
                  { message: 'Restarting Warning' },
                  { message: 'Restarting Warning' },
                ],
                properties: {
                  name: 'Restart',
                  hostId: 'b61a5c92-700e-4966-a13b-00633f03eea8',
                  hostName: 'XCP XO 8.3.0 master',
                },
                start: 1740742442803,
                status: 'success',
                end: 1740742443025,
              },
              {
                id: 'yocluwvvy7',
                properties: {
                  name: 'Waiting for host to be up',
                  hostId: 'b61a5c92-700e-4966-a13b-00633f03eea8',
                  hostName: 'XCP XO 8.3.0 master',
                },
                start: 1740742443025,
                status: 'success',
                end: 1740742711665,
              },
            ],
            end: 1740742711665,
          },
          {
            id: '98cjyfemfsp',
            properties: {
              name: 'Restarting host 84e555d8-267a-4720-aa5f-fd19035aadae',
              hostId: '84e555d8-267a-4720-aa5f-fd19035aadae',
              hostName: 'XCP XO 8.3.0 slave',
            },
            start: 1740742711666,
            status: 'success',
            tasks: [
              {
                id: '0dpmaqvwbcyq',
                properties: {
                  name: 'Evacuate',
                  hostId: '84e555d8-267a-4720-aa5f-fd19035aadae',
                  hostName: 'XCP XO 8.3.0 slave',
                },
                start: 1740742711870,
                status: 'success',
                end: 1740742712092,
              },
              {
                id: 'nf7isqmq9bn',
                properties: {
                  name: 'Restart',
                  hostId: '84e555d8-267a-4720-aa5f-fd19035aadae',
                  hostName: 'XCP XO 8.3.0 slave',
                },
                start: 1740742712701,
                status: 'success',
                end: 1740742712922,
                infos: [{ message: 'Restarting Warning' }],
              },
              {
                id: 'c5c47ikw7kv',
                properties: {
                  name: 'Waiting for host to be up',
                  hostId: '84e555d8-267a-4720-aa5f-fd19035aadae',
                  hostName: 'XCP XO 8.3.0 slave',
                },
                start: 1740742712922,
                status: 'success',
                end: 1740742984751,
                infos: [{ message: 'Restarting Warning' }],
              },
            ],
            end: 1740742984751,
          },
          {
            id: 'jrpv0vqtbfp',
            properties: {
              name: 'Restarting host 669df518-4e5d-4d84-b93a-9be2cdcdfca1',
              hostId: '669df518-4e5d-4d84-b93a-9be2cdcdfca1',
              hostName: 'XCP XO 8.3.0 slave 2',
            },
            start: 1740742984751,
            status: 'failure',
            tasks: [
              {
                id: 's40691blvf8',
                errors: [{ message: 'Restarting Error' }],
                properties: {
                  name: 'Evacuate',
                  hostId: '669df518-4e5d-4d84-b93a-9be2cdcdfca1',
                  hostName: 'XCP XO 8.3.0 slave 2',
                },
                start: 1740742984972,
                status: 'failure',
                end: 1740742985403,
                warnings: [{ message: 'Restarting Warning' }, { message: 'Restarting Warning' }],
                result: {
                  code: 'VM_REQUIRES_SR',
                  params: [
                    'OpaqueRef:1a5c8a87-0b3a-1432-3704-568712b89b2d',
                    'OpaqueRef:77de6432-55ce-2c0a-4cab-51ab757440a4',
                  ],
                  task: {
                    uuid: '8efadc33-710a-5114-7db8-4032ba746bd1',
                    name_label: 'Async.host.evacuate',
                    name_description: '',
                    allowed_operations: [],
                    current_operations: {},
                    created: '20250228T11:43:05Z',
                    finished: '20250228T11:43:05Z',
                    status: 'failure',
                    resident_on: 'OpaqueRef:e6a6a8be-753d-1761-77fe-ce85eae7c482',
                    progress: 1,
                    type: '<none/>',
                    result: '',
                    error_info: [
                      'VM_REQUIRES_SR',
                      'OpaqueRef:1a5c8a87-0b3a-1432-3704-568712b89b2d',
                      'OpaqueRef:77de6432-55ce-2c0a-4cab-51ab757440a4',
                    ],
                    other_config: {},
                    subtask_of: 'OpaqueRef:NULL',
                    subtasks: [],
                    backtrace:
                      '(((process xapi)(filename ocaml/xapi/xapi_host.ml)(line 614))((process xapi)(filename hashtbl.ml)(line 159))((process xapi)(filename hashtbl.ml)(line 165))((process xapi)(filename hashtbl.ml)(line 170))((process xapi)(filename ocaml/xapi/xapi_host.ml)(line 610))((process xapi)(filename ocaml/libs/xapi-stdext/lib/xapi-stdext-pervasives/pervasiveext.ml)(line 24))((process xapi)(filename ocaml/libs/xapi-stdext/lib/xapi-stdext-pervasives/pervasiveext.ml)(line 39))((process xapi)(filename ocaml/xapi/rbac.ml)(line 191))((process xapi)(filename ocaml/xapi/rbac.ml)(line 200))((process xapi)(filename ocaml/xapi/server_helpers.ml)(line 75)))',
                  },
                  message:
                    'VM_REQUIRES_SR(OpaqueRef:1a5c8a87-0b3a-1432-3704-568712b89b2d, OpaqueRef:77de6432-55ce-2c0a-4cab-51ab757440a4)',
                  name: 'XapiError',
                  stack:
                    'XapiError: VM_REQUIRES_SR(OpaqueRef:1a5c8a87-0b3a-1432-3704-568712b89b2d, OpaqueRef:77de6432-55ce-2c0a-4cab-51ab757440a4)\n    at Function.wrap (file:///usr/local/lib/node_modules/xo-server/node_modules/xen-api/_XapiError.mjs:16:12)\n    at default (file:///usr/local/lib/node_modules/xo-server/node_modules/xen-api/_getTaskResult.mjs:13:29)\n    at Xapi._addRecordToCache (file:///usr/local/lib/node_modules/xo-server/node_modules/xen-api/index.mjs:1072:24)\n    at file:///usr/local/lib/node_modules/xo-server/node_modules/xen-api/index.mjs:1106:14\n    at Array.forEach (<anonymous>)\n    at Xapi._processEvents (file:///usr/local/lib/node_modules/xo-server/node_modules/xen-api/index.mjs:1096:12)\n    at Xapi._watchEvents (file:///usr/local/lib/node_modules/xo-server/node_modules/xen-api/index.mjs:1269:14)\nFrom:\n    at Xapi.addSyncStackTrace [as _addSyncStackTrace] (file:///usr/local/lib/node_modules/xo-server/node_modules/xen-api/index.mjs:78:26)\n    at Xapi.watchTask (file:///usr/local/lib/node_modules/xo-server/node_modules/xen-api/index.mjs:783:33)\n    at Xapi.callAsync (file:///usr/local/lib/node_modules/xo-server/node_modules/xen-api/index.mjs:330:26)',
                },
              },
            ],
            end: 1740742985403,
            result: {
              code: 'VM_REQUIRES_SR',
              params: [
                'OpaqueRef:1a5c8a87-0b3a-1432-3704-568712b89b2d',
                'OpaqueRef:77de6432-55ce-2c0a-4cab-51ab757440a4',
              ],
              task: {
                uuid: '8efadc33-710a-5114-7db8-4032ba746bd1',
                name_label: 'Async.host.evacuate',
                name_description: '',
                allowed_operations: [],
                current_operations: {},
                created: '20250228T11:43:05Z',
                finished: '20250228T11:43:05Z',
                status: 'failure',
                resident_on: 'OpaqueRef:e6a6a8be-753d-1761-77fe-ce85eae7c482',
                progress: 1,
                type: '<none/>',
                result: '',
                error_info: [
                  'VM_REQUIRES_SR',
                  'OpaqueRef:1a5c8a87-0b3a-1432-3704-568712b89b2d',
                  'OpaqueRef:77de6432-55ce-2c0a-4cab-51ab757440a4',
                ],
                other_config: {},
                subtask_of: 'OpaqueRef:NULL',
                subtasks: [],
              },
              message:
                'VM_REQUIRES_SR(OpaqueRef:1a5c8a87-0b3a-1432-3704-568712b89b2d, OpaqueRef:77de6432-55ce-2c0a-4cab-51ab757440a4)',
              name: 'XapiError',
            },
          },
        ],
        end: 1740742985403,
        result: {
          code: 'VM_REQUIRES_SR',
          params: ['OpaqueRef:1a5c8a87-0b3a-1432-3704-568712b89b2d', 'OpaqueRef:77de6432-55ce-2c0a-4cab-51ab757440a4'],
          task: {
            uuid: '8efadc33-710a-5114-7db8-4032ba746bd1',
            name_label: 'Async.host.evacuate',
            name_description: '',
            allowed_operations: [],
            current_operations: {},
            created: '20250228T11:43:05Z',
            finished: '20250228T11:43:05Z',
            status: 'failure',
            resident_on: 'OpaqueRef:e6a6a8be-753d-1761-77fe-ce85eae7c482',
            progress: 1,
            type: '<none/>',
            result: '',
            error_info: [
              'VM_REQUIRES_SR',
              'OpaqueRef:1a5c8a87-0b3a-1432-3704-568712b89b2d',
              'OpaqueRef:77de6432-55ce-2c0a-4cab-51ab757440a4',
            ],
            other_config: {},
            subtask_of: 'OpaqueRef:NULL',
            subtasks: [],
            backtrace:
              '(((process xapi)(filename ocaml/xapi/xapi_host.ml)(line 614))((process xapi)(filename hashtbl.ml)(line 159))((process xapi)(filename hashtbl.ml)(line 165))((process xapi)(filename hashtbl.ml)(line 170))((process xapi)(filename ocaml/xapi/xapi_host.ml)(line 610))((process xapi)(filename ocaml/libs/xapi-stdext/lib/xapi-stdext-pervasives/pervasiveext.ml)(line 24))((process xapi)(filename ocaml/libs/xapi-stdext/lib/xapi-stdext-pervasives/pervasiveext.ml)(line 39))((process xapi)(filename ocaml/xapi/rbac.ml)(line 191))((process xapi)(filename ocaml/xapi/rbac.ml)(line 200))((process xapi)(filename ocaml/xapi/server_helpers.ml)(line 75)))',
          },
          message:
            'VM_REQUIRES_SR(OpaqueRef:1a5c8a87-0b3a-1432-3704-568712b89b2d, OpaqueRef:77de6432-55ce-2c0a-4cab-51ab757440a4)',
          name: 'XapiError',
        },
      },
    ],
    end: 1740742985404,
  },
]

export function useTaskTree() {
  // const { records, isReady: isTaskReady } = useTaskStore().subscribe()
  // const { records } = useTaskStore().subscribe()
  const { isReady: isTaskReady, hasError } = useTaskStore().subscribe()
  const { filter, predicate } = useTreeFilter()
  const isReady = logicAnd(isTaskReady)

  const tasks = computed(() => {
    // const ONE_DAY = 48 * 60 * 60 * 1000
    //
    // const now = Date.now()
    // return records.value.filter(task => now - task.start < ONE_DAY).map(task => convertTaskToCore(task))
    return mockedTasks.map(task => convertTaskToCore(task))
  })

  const defineTaskTree = (tasks: Task[]): TreeNodeDefinition[] => {
    return tasks.map(task => {
      if (!task.subtasks || task.subtasks.length === 0) {
        return defineTree([task], {
          getLabel: task => task.name,
          predicate,
          discriminator: 'task',
        })[0]
      }

      const childTreeGetter = () => defineTaskTree(task.subtasks ?? [])

      return defineTree(
        [task],
        {
          getLabel: task => task.name,
          predicate,
          discriminator: 'task',
        },
        childTreeGetter
      )[0]
    })
  }

  const definitions = computed(() => defineTaskTree(tasks.value))

  const { nodes } = useTree(definitions)

  return {
    isReady,
    hasError,
    tasks: nodes,
    filter,
  }
}
