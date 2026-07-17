import map from 'lodash/map.js'
import range from 'lodash/range.js'
import { invalidParameters } from 'xo-common/api-errors.js'
import assert from 'node:assert'
import { createHash } from 'node:crypto'
import { Readable, Transform } from 'node:stream'
import { CancelToken } from 'promise-toolbox'
import YAML from 'yaml'

const FETCH_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const XEN_GUEST_AGENT_READY_TIMEOUT = 10 * 60 * 1000 // 10 minutes

// =============================================================================

// Create a Kubernetes Cluster composed of:
//   - 1 control plane for standard cluster or 3 control planes for HA cluster
//   - nbNodes nodes working for the control plane
//
// See: https://kubernetes.io/docs/reference/glossary/?all=true#term-cluster
export async function createCluster({
  clusterName,
  controlPlaneIpAddress,
  controlPlaneIpAddresses,
  gatewayIpAddress,
  controlPlanePoolSize,
  k8sVersion,
  nameservers,
  nbNodes,
  network: networkId,
  searches = [],
  sr,
  sshKey,
  vipAddress,
  workerNodeIpAddresses,
  xoUrl,
  useInsecureXoConnection,
  customClusterPodCIDR,
  customClusterServiceCIDR,
}) {
  if (controlPlaneIpAddress !== undefined && controlPlaneIpAddresses !== undefined) {
    throw invalidParameters('You must use either controlPlaneIpAddress or controlPlaneIpAddresses, not both')
  }

  const highAvailability = controlPlanePoolSize > 1

  const xapi = await this.getXapi(sr)
  const tag = 'xo:recipes:kubernetes-cluster:' + new Date().toJSON()

  const staticIpParams = [
    highAvailability ? controlPlaneIpAddresses : controlPlaneIpAddress,
    gatewayIpAddress,
    nameservers,
    workerNodeIpAddresses,
  ]
  if (highAvailability) staticIpParams.push(vipAddress)
  const definedStaticIpParams = staticIpParams.reduce((n, param) => n + Number(param !== undefined), 0)

  if (definedStaticIpParams !== staticIpParams.length) {
    throw invalidParameters('All static configuration parameters must be defined')
  }
  if (highAvailability) {
    assert.strict.equal(controlPlanePoolSize, controlPlaneIpAddresses.length)

    if (vipAddress.includes('/')) {
      vipAddress = vipAddress.split('/')[0]
    }
  }

  const networkInterface = 'enX0'

  const k8sPackages = ['ca-certificates', 'snapd', 'xenstore-utils']

  const k8sVersionParts = k8sVersion.split('.')

  const microk8sVersion = k8sVersion !== undefined ? `--channel=${k8sVersionParts[0]}.${k8sVersionParts[1]}/stable` : ''

  /* Install microk8s from snap */
  /* Validate and set default values for CIDR ranges */
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/

  const requireCidrIp = (ip, label) => {
    if (ip === undefined) {
      throw invalidParameters(`${label} is required`)
    }
    if (!cidrRegex.test(ip)) {
      throw invalidParameters(`${label} must be in valid CIDR format (e.g., 10.0.0.10/24)`)
    }
  }

  const requireIpOrCidr = (ip, label) => {
    if (ip === undefined) {
      throw invalidParameters(`${label} is required`)
    }
    if (!cidrRegex.test(ip) && !ipv4Regex.test(ip)) {
      throw invalidParameters(`${label} must be a valid IPv4 address (e.g., 10.0.0.10) or CIDR (e.g., 10.0.0.10/24)`)
    }
  }

  if (highAvailability) {
    controlPlaneIpAddresses.forEach((ip, index) => requireCidrIp(ip, `controlPlaneIpAddresses[${index}]`))
    requireIpOrCidr(vipAddress, 'vipAddress')
  } else {
    requireCidrIp(controlPlaneIpAddress, 'controlPlaneIpAddress')
  }

  workerNodeIpAddresses.forEach((ip, index) => requireCidrIp(ip, `workerNodeIpAddresses[${index}]`))

  requireCidrIp(customClusterPodCIDR, 'customClusterPodCIDR')
  requireCidrIp(customClusterServiceCIDR, 'customClusterServiceCIDR')

  /* Install microk8s from snap */
  const clusterPodCIDR = customClusterPodCIDR
  const clusterServiceCIDR = customClusterServiceCIDR
  const clusterDNSIP = clusterServiceCIDR.replace(/\.0\/\d+$/, '.10')
  const clusterSelfIP = clusterServiceCIDR.replace(/\.0\/\d+$/, '.1')

  // MicroK8s launch configuration version 0.2.0 (will be copied to the VM with cloud-init write_files)
  const launchConfigv020 = {
    version: '0.2.0',
    extraKubeAPIServerArgs: {
      '--authorization-mode': 'RBAC,Node',
    },
    extraKubeletArgs: {
      '--cluster-dns': clusterDNSIP,
      '--cluster-domain': 'cluster.local',
      '--cloud-provider': 'external',
    },
    extraKubeProxyArgs: {
      '--cluster-cidr': clusterPodCIDR,
    },
    extraKubeControllerManagerArgs: {
      '--cloud-provider': 'external',
    },
    extraCNIEnv: {
      IPv4_SUPPORT: true,
      IPv4_CLUSTER_CIDR: clusterPodCIDR,
      IPv4_SERVICE_CIDR: clusterServiceCIDR,
    },
    extraSANs: [
      clusterSelfIP,
      // Include VIP address in the certificate Subject Alternate Names
      ...(highAvailability ? [vipAddress] : []),
    ],
    addons: [
      {
        name: 'dns',
      },
      { name: 'helm' },
      { name: 'rbac' },
      // { name: "metrics-server"}, // TODO: Fix issues with enabling metrics
      ...(highAvailability ? [{ name: 'ha-cluster' }] : []),
    ],
  }

  const k8sCommands = [
    `snap install snapd --channel latest/stable`,
    // Add MicroK8s launch configuration
    `mkdir -p /var/snap/microk8s/common/`,
    `cp /home/debian/microk8s-config.yaml /var/snap/microk8s/common/.microk8s.yaml`,
    `snap install microk8s --classic ${microk8sVersion}`,
    `alias kubectl='/snap/bin/microk8s kubectl'`,
    `alias helm='/snap/bin/microk8s helm'`,
    `alias microk8s='/snap/bin/microk8s'`,
    `microk8s status --wait-ready`,
    `usermod -a -G microk8s debian`,
  ]

  const k8sCPCommands = [
    // Export the kubeconfig
    'export HOME=/home/debian',
    'mkdir -p /home/debian/.kube',
    'microk8s config > /home/debian/.kube/config',
    'chown 1000:1000 -R /home/debian/.kube',
  ]
  if (highAvailability) {
    k8sCPCommands.push(
      // Lock certificates reissue to avoid issues with multiple control planes
      'touch /var/snap/microk8s/current/var/lock/no-cert-reissue'
    )
  }

  // Values for kube vip helm chart (will be copied to the VM with cloud-init write_files)
  const kubeVipValues = YAML.stringify({
    config: {
      address: vipAddress,
    },
    env: {
      vip_interface: networkInterface,
      vip_arp: true,
      lb_enable: true,
      lb_port: 16443,
      cp_enable: true,
      svc_enable: true,
      vip_leaderelection: true,
      svc_election: true,
    },
    nodeSelector: {
      'node.kubernetes.io/microk8s-controlplane': 'microk8s-controlplane',
    },
  })

  const kubeVipCmd = highAvailability
    ? [
        'microk8s status --wait-ready',
        'helm repo add kube-vip https://kube-vip.github.io/helm-charts',
        'helm repo update',
        // Write values file for kube-vip
        `helm install kube-vip kube-vip/kube-vip --namespace kube-system --create-namespace -f /home/debian/kubevip-values.yml`,
      ]
    : ''

  // Values for Xen Orchestra CCM (will be copied to the VM with cloud-init write_files)
  // Get new token from XOA to use in the CCM
  const xoConnection = Array.from(this.apiConnections).find(
    connection => connection.get('user_id') === this.apiContext.user.id
  )
  const userId = xoConnection.get('user_id', undefined)
  const xoToken = await this.createAuthenticationToken({
    expiresIn: '0.5 year',
    userId,
    description: `XOA CCM token for Kubernetes cluster ${clusterName}`,
  })

  // Ensure xoUrl has the correct protocol
  if (!xoUrl.startsWith('http://') && !xoUrl.startsWith('https://')) {
    xoUrl = useInsecureXoConnection ? `http://${xoUrl}` : `https://${xoUrl}`
  }

  const xenOrchestraCcmValues = {
    enabledControllers: ['*'],
    config: {
      url: xoUrl,
      insecure: useInsecureXoConnection,
      token: xoToken.id,
    },
  }

  if (highAvailability) {
    xenOrchestraCcmValues.useDaemonSet = true
  }

  const xenOrchestraCcmCmd = [
    'microk8s status --wait-ready',
    'helm install --namespace=kube-system -f /home/debian/xo-ccm-values.yml xenorchestra-cloud-controller-manager oci://ghcr.io/vatesfr/charts/xenorchestra-cloud-controller-manager',
  ]

  const controlPlaneNetworkConfig = {
    version: 2,
    ethernets: {
      [networkInterface]: {
        dhcp4: false,
        dhcp6: false,
        addresses: [highAvailability ? controlPlaneIpAddresses[0] : controlPlaneIpAddress],
        nameservers: {
          search: searches,
          addresses: nameservers,
        },
        // Set gateway4 only if gatewayIpAddress is ipv4, otherwise if it's ipv6 use gateway6
        ...(gatewayIpAddress.includes(':') ? { gateway6: gatewayIpAddress } : { gateway4: gatewayIpAddress }),
      },
    },
  }

  const xenstoreCommands = [
    // Store the Kubernetes API token and certificate in the control plane. Give TTL in seconds of 60 minutes to allow more than 1 node to join.
    `xenstore-write vm-data/kubernetes-token "$(microk8s add-node -l 3600 | awk 'FNR == 2 {print $3}')"`,
  ]
  if (highAvailability) {
    xenstoreCommands.push(`xenstore-write vm-data/kubernetes-vip ${vipAddress}`)
  }

  const masterNodeHostname = highAvailability ? 'cp-1' : 'cp'

  // Set node-ip to ensure the correct IP is used by kubelet
  // This fix a big with the CA root certificate
  launchConfigv020.extraKubeletArgs['--node-ip'] = highAvailability
    ? controlPlaneIpAddresses[0].split('/')[0]
    : controlPlaneIpAddress.split('/')[0]

  // Create the control plane
  const controlPlaneConfig = {
    hostname: masterNodeHostname,
    manage_etc_hosts: `localhost`,
    ssh_authorized_keys: [`${sshKey}`],
    package_upgrade: true,
    packages: k8sPackages,
    runcmd: [
      `echo "Configuring Kubernetes cluster"`,
      `echo "Cluster settings: High Availablity: ${highAvailability ? 'true' : 'false'}, Static IP: true"`,
      `echo "Control Plane Pool Size: ${controlPlanePoolSize}"`,
      `echo "Kubernetes version: ${k8sVersion}"`,
      ...k8sCommands,
      /* Setup the cluster configuration */
      ...k8sCPCommands,
      `microk8s status --wait-ready && microk8s kubectl wait --for=condition=Ready node/${masterNodeHostname} --timeout=30m`,
      ...xenOrchestraCcmCmd,
      ...kubeVipCmd,
      `microk8s kubectl taint nodes --selector=kubernetes.io/hostname=${masterNodeHostname} cp-node=true:PreferNoSchedule`,
      /* Fix Calico not using enX0 interface, remove when PR upstream merged https://github.com/projectcalico/calico/pull/10148/ */
      `kubectl patch felixconfigurations.crd.projectcalico.org default --type merge -p '{"spec":{"mtuIfacePattern":"^((en|wl|ww|sl|ib)[PcopsvxX].*|(eth|wlan|wwan).*)"}}'`,
      ...xenstoreCommands,
    ],
    write_files: [
      {
        // Kube-vip values file
        owner: 'root:root',
        path: '/home/debian/kubevip-values.yml',
        permissions: '0644',
        content: kubeVipValues,
      },
      {
        // Xen Orchestra CCM values file
        owner: 'root:root',
        path: '/home/debian/xo-ccm-values.yml',
        permissions: '0644',
        content: YAML.stringify(xenOrchestraCcmValues),
      },
      {
        // Microk8s launch configuration file
        content: YAML.stringify(launchConfigv020),
        owner: 'root:root',
        path: '/home/debian/microk8s-config.yaml',
        permissions: '0644',
      },
    ],
  }

  const templateVm = await _createTemplate(this, xapi, sr, networkId, controlPlaneNetworkConfig)
  let tagResult
  let finalError
  try {
    // Set the nodes size to 10 GB
    const nodeSize = 10737418240

    const controlPlaneVmId = await this.callApiMethod(xoConnection, 'vm.create', {
      template: templateVm.$id,
      name_label: highAvailability ? clusterName + ' - Control Plane 1' : clusterName + ' - Control Plane',
      name_description: clusterName + ' Kubernetes Cluster created with the Hub recipe',
      existingDisks: {
        // 10G to have enough space to pull the images needed by k8s.
        0: { size: nodeSize, $SR: sr.id },
      },
      VIFs: [{ network: networkId }],
      cloudConfig: '#cloud-config\n' + YAML.stringify(controlPlaneConfig),
      networkConfig: YAML.stringify(controlPlaneNetworkConfig),
      tags: [tag, clusterName],

      CPUs: 4,
      memoryMax: 4 * 1024 * 1024 * 1024, // 4 GB
    })

    let xapiControlPlaneVm = await this.getXapiObject(controlPlaneVmId)
    xapiControlPlaneVm = await xapi.barrier(xapiControlPlaneVm.$ref)
    await xapiControlPlaneVm.update_other_config({
      'xo:resource:namespace': null,
      'xo:resource:xva:version': null,
      'xo:resource:xva:id': null,
    })

    await this.callApiMethod(xoConnection, 'vm.start', {
      vm: controlPlaneVmId,
    })

    // Await controlPlaneVm end booting to be ready to be joined by its nodes.
    xapiControlPlaneVm = await xapiControlPlaneVm.$xapi._waitObjectState(xapiControlPlaneVm.$id, obj =>
      highAvailability
        ? obj.xenstore_data !== undefined &&
          obj.xenstore_data['vm-data/kubernetes-token'] !== undefined &&
          obj.xenstore_data['vm-data/kubernetes-vip'] !== undefined &&
          obj.$guest_metrics.networks['0/ip'] !== undefined
        : obj.xenstore_data !== undefined &&
          obj.xenstore_data['vm-data/kubernetes-token'] !== undefined &&
          obj.$guest_metrics.networks['0/ip'] !== undefined
    )

    // Data used by the node to join the control plane
    const token = xapiControlPlaneVm.xenstore_data['vm-data/kubernetes-token']

    // Add join token to microk8s launch configuration
    launchConfigv020.join = {
      url: token,
    }

    // Other CP for HA
    const cpVMs = []
    if (highAvailability) {
      // Create the other control planes sequentially to avoid TOO_MANY_STORAGE_MIGRATES error
      // The first control plane is already created
      for (const i of range(2, controlPlanePoolSize + 1)) {
        const controlPlaneNetworkConfig = {
          version: 2,
          ethernets: {
            [networkInterface]: {
              dhcp4: false,
              dhcp6: false,
              addresses: [controlPlaneIpAddresses[i - 1]],
              nameservers: {
                search: searches,
                addresses: nameservers,
              },
              // Set gateway4 only if gatewayIpAddress is ipv4, otherwise if it's ipv6 use gateway6
              ...(gatewayIpAddress.includes(':') ? { gateway6: gatewayIpAddress } : { gateway4: gatewayIpAddress }),
            },
          },
        }

        // Set node-ip to ensure the correct IP is used by kubelet
        // This fix a big with the CA root certificate
        launchConfigv020.extraKubeletArgs['--node-ip'] = controlPlaneIpAddresses[i - 1].split('/')[0]

        const controlPlaneConfig = {
          hostname: `cp-${i}`,
          manage_etc_hosts: `localhost`,
          ssh_authorized_keys: [`${sshKey}`],
          package_upgrade: true,
          packages: k8sPackages,
          runcmd: [
            ...k8sCommands,
            // The node joined the cluster control plane
            `xenstore-write vm-data/kubernetes-cp${i}-joined true`,
            `microk8s status --wait-ready && microk8s kubectl wait --for=create node/cp-${i} --timeout=30m`,
            `microk8s kubectl taint nodes --selector=kubernetes.io/hostname=cp-${i} cp-node=true:PreferNoSchedule`,
            ...k8sCPCommands,
          ],
          write_files: [
            {
              // Microk8s launch configuration file
              content: YAML.stringify(launchConfigv020),
              owner: 'root:root',
              path: '/home/debian/microk8s-config.yaml',
              permissions: '0644',
            },
          ],
        }
        const controlPlaneVmId = await this.callApiMethod(xoConnection, 'vm.create', {
          template: templateVm.$id,
          name_label: clusterName + ` - Control Plane ${i}`,
          name_description: clusterName + ' Kubernetes Cluster created with the Hub recipe',
          existingDisks: {
            0: { size: nodeSize, $SR: sr.id },
          },
          VIFs: [{ network: networkId }],
          cloudConfig: '#cloud-config\n' + YAML.stringify(controlPlaneConfig),
          networkConfig: YAML.stringify(controlPlaneNetworkConfig),
          tags: [tag, clusterName],
        })
        let controlPlaneVm = await this.getXapiObject(controlPlaneVmId)
        controlPlaneVm = await xapi.barrier(controlPlaneVm.$ref)
        await controlPlaneVm.update_other_config({
          'xo:resource:namespace': null,
          'xo:resource:xva:version': null,
          'xo:resource:xva:id': null,
        })

        cpVMs.push({
          vm: controlPlaneVm,
          vmId: controlPlaneVmId,
          name: `cp${i}`,
        })
      }

      // Start all control planes at once
      await Promise.all(
        cpVMs.map(({ vmId }) =>
          this.callApiMethod(xoConnection, 'vm.start', {
            vm: vmId,
          })
        )
      )
    }

    /* Worker creation */
    launchConfigv020.join.worker = true

    const workerVMs = []
    // Create worker nodes sequentially
    for (const i of range(1, nbNodes + 1)) {
      // Set node-ip to ensure the correct IP is used by kubelet
      // This fix a big with the CA root certificate
      launchConfigv020.extraKubeletArgs['--node-ip'] = workerNodeIpAddresses[i - 1].split('/')[0]

      // Create worker node
      const workerConfig = {
        hostname: `worker-${i}`,
        manage_etc_hosts: `localhost`,
        ssh_authorized_keys: [`${sshKey}`],
        package_upgrade: true,
        packages: k8sPackages,
        runcmd: [
          ...k8sCommands,
          // The worker node joined the cluster
          `xenstore-write vm-data/kubernetes-worker${i}-joined true`,
        ],
        write_files: [
          {
            // Microk8s launch configuration file
            content: YAML.stringify(launchConfigv020),
            owner: 'root:root',
            path: '/home/debian/microk8s-config.yaml',
            permissions: '0644',
          },
        ],
      }

      const workerNetworkConfig = {
        version: 2,
        ethernets: {
          [networkInterface]: {
            dhcp4: false,
            dhcp6: false,
            addresses: [workerNodeIpAddresses[i - 1]],
            nameservers: {
              search: searches,
              addresses: nameservers,
            },
            // Set gateway4 only if gatewayIpAddress is ipv4, otherwise if it's ipv6 use gateway6
            ...(gatewayIpAddress.includes(':') ? { gateway6: gatewayIpAddress } : { gateway4: gatewayIpAddress }),
          },
        },
      }

      const workerVmId = await this.callApiMethod(xoConnection, 'vm.create', {
        template: templateVm.$id,
        name_label: clusterName + ' - Worker ' + i,
        name_description: clusterName + ' Kubernetes Cluster created with the Hub recipe',
        existingDisks: {
          0: { size: nodeSize, $SR: sr.id },
        },
        VIFs: [{ network: networkId }],
        cloudConfig: '#cloud-config\n' + YAML.stringify(workerConfig),
        networkConfig: YAML.stringify(workerNetworkConfig),
        tags: [tag, clusterName],
      })

      let xapiWorkerVm = await this.getXapiObject(workerVmId)
      xapiWorkerVm = await xapi.barrier(xapiWorkerVm.$ref)
      await xapiWorkerVm.update_other_config({
        'xo:resource:namespace': null,
        'xo:resource:xva:version': null,
        'xo:resource:xva:id': null,
      })

      workerVMs.push({
        vm: xapiWorkerVm,
        vmId: workerVmId,
        name: `worker${i}`,
      })
    }

    // Start all worker nodes at once
    await Promise.all(
      workerVMs.map(({ vmId }) =>
        this.callApiMethod(xoConnection, 'vm.start', {
          vm: vmId,
        })
      )
    )

    // Await for the boot and the joining of the other nodes.
    await Promise.all(
      map(cpVMs.concat(workerVMs), async ({ vm, name }) => {
        await vm.$xapi._waitObjectState(
          vm.$id,
          obj => obj.xenstore_data !== undefined && obj.xenstore_data[`vm-data/kubernetes-${name}-joined`] === 'true'
        )
      })
    )

    /** Save cluster tag in user preferences */
    let user
    if (userId !== undefined) {
      user = await this.getUser(userId)
      const { filters, ...otherPreferences } = user.preferences ?? {}
      const vmFilters = filters?.VM ?? {}
      const preferences = {
        filters: {
          ...filters,
          VM: {
            ...vmFilters,
            [tag]: `tags:/^${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$/`,
          },
        },
        ...otherPreferences,
      }
      await this.callApiMethod(xoConnection, 'user.set', {
        id: userId,
        preferences,
      })
    }

    tagResult = tag
  } catch (error) {
    finalError = new Error(`Failed to create Kubernetes cluster: ${error.message}`, {
      cause: error,
    })
  } finally {
    let cleanupError

    // Destroy the template VM used for the cluster creation
    try {
      await templateVm.$destroy()
    } catch (error) {
      cleanupError = error
    }

    if (finalError && cleanupError) {
      finalError = new Error(
        `${finalError.message}. Additionally, failed to destroy temporary template VM: ${cleanupError.message}`,
        {
          cause: finalError.cause ?? finalError,
        }
      )
    } else if (cleanupError) {
      finalError = new Error(`Failed to destroy temporary template VM: ${cleanupError.message}`, {
        cause: cleanupError,
      })
    }
  }

  if (finalError) {
    throw finalError
  }

  return tagResult
}

/**
 * This function create a template VM. It needs network valid configuration to be able to install the Xen guest agent in the template.
 * @param {*} ctx
 * @param {*} xapi
 * @param {*} sr
 * @param {string} networkId
 * @param {*} networkConfig
 * @returns template VM to use for the cluster creation
 */
async function _createTemplate(ctx, xapi, sr, networkId, networkConfig) {
  const templateId = '07d91aaa-43f7-430a-bf84-0edb6714df0f' // Debian 12 Bookworm
  const createParamsVM = {
    name_label: 'kubernetes template for recipe',
    vifs: [{ network: networkId }],
  }
  const VDIName = 'kubernetesRecipeTemplateDisk'

  // Download and import the base VDI
  let vdi
  try {
    vdi = await _downloadBaseVDI(xapi, sr, VDIName)
  } catch (error) {
    throw new Error('Failed to download and import the base VDI: ' + error.message)
  }

  // Create the template VM
  let vm
  try {
    vm = await xapi.createVm(templateId, createParamsVM)
  } catch (error) {
    throw await _cleanTemplateError('Failed to create template VM', error, [{ type: 'VDI', resource: vdi }])
  }

  // Delete all disks associated to the VM before attaching the imported base disk.
  try {
    vm = await xapi.barrier(vm.$ref) // Reload vm object to ensure we have the VBDs updated after attaching the temporary VDI
    const vbdsRef = vm.VBDs
    await Promise.all(
      map(vbdsRef, async vbdRef => {
        try {
          const vbd = await xapi._getOrWaitObject(vbdRef)
          const vdiRef = await vbd.VDI
          const vdi = await xapi._getOrWaitObject(vdiRef)
          await vdi.$destroy()
        } catch (error) {
          throw new Error(`Failed to destroy VDI of VBD ${vbdRef} while cleaning template VM disks: ${error.message}`)
        }
      })
    )
  } catch (error) {
    throw await _cleanTemplateError('Failed to destroy all disks of the template VM', error, [
      { type: 'VM', resource: vm },
      { type: 'VDI', resource: vdi },
    ])
  }

  // Attach the VDI to the template VM
  try {
    await _attachVDIToVM(xapi, vm, vdi, sr) // Error handling ?
  } catch (error) {
    throw await _cleanTemplateError('Failed to attach VDI to VM', error, [
      { type: 'VM', resource: vm },
      { type: 'VDI', resource: vdi },
    ])
  }

  // Install Xen Guest Agent
  try {
    await _installXenGuestAgent(xapi, vm, networkConfig)
  } catch (error) {
    throw await _cleanTemplateError('Failed to install Xen Guest Agent', error, [
      { type: 'VM', resource: vm },
      { type: 'VDI', resource: vdi },
    ])
  }

  // Transform the VM into a template
  try {
    await vm.set_is_a_template(true)
  } catch (error) {
    throw await _cleanTemplateError('Failed to set VM as template', error, [
      { type: 'VM', resource: vm },
      { type: 'VDI', resource: vdi },
    ])
  }

  return xapi.barrier(vm.$ref)
}

/**
 * Clean up resources and return a new error with the cleanup errors if any.
 * @param {string} message - The error message to use for the new error.
 * @param {Error} error - The original error that occurred.
 * @param {Array} resourcesToClean - The resources to clean up.
 * @param {Array} cleanupErrors - The errors that occurred during cleanup.
 */
async function _cleanTemplateError(message, error, resourcesToClean = [], cleanupErrors = []) {
  cleanupErrors = cleanupErrors.concat(await _cleanupResources(resourcesToClean))

  const cleanupMessage = cleanupErrors.length === 0 ? '' : ` Cleanup also failed: ${cleanupErrors.join('; ')}.`

  return new Error(`${message}: ${error.message}.${cleanupMessage}`, {
    cause: error,
  })
}

/**
 * Clean use of .$destroy() for the given resources and collect any errors that occur during cleanup.
 * @param {Array} resourcesToClean - The resources to clean up. Each item should be an object with a 'type' string and a 'resource' object that has a .$destroy() method.
 * @returns {Array} An array of error messages from the cleanup process.
 */
async function _cleanupResources(resourcesToClean) {
  const cleanupErrors = []

  for (const { type, resource } of resourcesToClean) {
    if (resource === undefined) {
      continue
    }

    try {
      await resource.$destroy()
    } catch (error) {
      cleanupErrors.push(`${type} destroy failed: ${error.message}`)
    }
  }

  return cleanupErrors
}

/**
 * Download and import the base VDI for the Kubernetes template with a timeout
 * @param {*} xapi - The XAPI client.
 * @param {*} sr - The SR object.
 * @param {string} vdiName - The name of the VDI.
 * @returns VDI object of the downloaded and imported base disk
 */
async function _downloadBaseVDI(xapi, sr, vdiName) {
  const hash = createHash('sha512')
  const baseUrl = 'https://cloud.debian.org/images/cloud/trixie/20260601-2496'
  const baseDiskName = 'debian-13-genericcloud-amd64-20260601-2496.raw'
  const baseDiskUrl = `${baseUrl}/${baseDiskName}`
  const checksumUrl = `${baseUrl}/SHA512SUMS`
  const downloadTimeoutMessage = `Timed out downloading and importing base disk after ${_formatDuration(FETCH_TIMEOUT)}`
  const vdiSize = 5 * 1024 * 1024 * 1024 // 5 GB
  let vdi
  const downloadController = new AbortController()
  const cancelTokenSource = CancelToken.source()
  let baseDiskResponse
  let nodeStream

  try {
    vdi = await xapi._getOrWaitObject(
      await xapi.VDI_create({
        name_label: vdiName,
        SR: sr._xapiRef,
        virtual_size: vdiSize,
      })
    )
  } catch (error) {
    throw new Error('Failed to create VDI: ' + error.message)
  }

  downloadController.signal.addEventListener('abort', () => {
    cancelTokenSource.cancel()
  })

  try {
    await _withTimeout(
      _downloadAndImportBaseDisk({
        baseDiskUrl,
        cancelToken: cancelTokenSource.token,
        hash,
        signal: downloadController.signal,
        vdi,
        onResponse(response) {
          baseDiskResponse = response
        },
        onStreamCreated(stream) {
          nodeStream = stream
        },
      }),
      FETCH_TIMEOUT,
      downloadTimeoutMessage
    )
  } catch (error) {
    downloadController.abort(error)
    nodeStream?.destroy(error)
    baseDiskResponse?.body?.cancel?.().catch(() => undefined)

    throw await _cleanTemplateError('Failed to download base disk', error, [{ type: 'VDI', resource: vdi }])
  }

  const computedChecksum = hash.digest('hex')
  let remoteChecksum
  try {
    remoteChecksum = await _getRemoteChecksum(checksumUrl, baseDiskName)
  } catch (error) {
    throw await _cleanTemplateError('Failed to get remote checksum', error, [{ type: 'VDI', resource: vdi }])
  }

  if (!computedChecksum) {
    throw await _cleanTemplateError(
      'Import finished before stream checksum was computed',
      new Error('Missing computed checksum'),
      [{ type: 'VDI', resource: vdi }]
    )
  }

  if (computedChecksum !== remoteChecksum) {
    throw await _cleanTemplateError(
      'Checksum mismatch for the downloaded disk',
      new Error(`expected ${remoteChecksum}, got ${computedChecksum}`),
      [{ type: 'VDI', resource: vdi }]
    )
  }

  return vdi
}

/**
 * Download the base disk and import it into the given VDI.
 * @param {*} options - The options for the download and import process.
 * @param {string} options.baseDiskUrl - The URL of the base disk to download.
 * @param {CancelToken} options.cancelToken - The cancel token to use for the import process.
 * @param {Hash} options.hash - The hash object to update with the downloaded data for checksum calculation.
 * @param {AbortSignal} options.signal - The signal to use for aborting the download.
 * @param {*} options.vdi - The VDI object to import the disk into.
 * @param {function} options.onResponse - A callback function that will be called with the response of the fetch request.
 * @param {function} options.onStreamCreated - A callback function that will be called with the Node.js Readable stream created from the response body.
 */
async function _downloadAndImportBaseDisk({
  baseDiskUrl,
  cancelToken,
  hash,
  signal,
  vdi,
  onResponse,
  onStreamCreated,
}) {
  const response = await fetch(baseDiskUrl, {
    signal,
  })
  onResponse(response)

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`)
    error.status = response.status
    await response.body?.cancel?.()
    throw error
  }

  if (response.body === null) {
    throw new Error('Response body is empty')
  }

  const checksumStreamTransform = new Transform({
    transform(chunk, encoding, callback) {
      hash.update(chunk)
      callback(null, chunk)
    },
  })

  const nodeStream = Readable.fromWeb(response.body).pipe(checksumStreamTransform)
  nodeStream.length = Number(response.headers.get('Content-Length'))
  onStreamCreated(nodeStream)

  await vdi.$importContent(nodeStream, {
    format: 'raw',
    cancelToken,
  })
}

/**
 * Wrap a promise with a timeout.
 * @param {Promise} promise - The promise to wrap.
 * @param {number} timeout - The timeout in milliseconds.
 * @param {string} message - The error message to use if the timeout is reached.
 * @returns {Promise} - A promise that rejects with a timeout error if the original promise does not resolve in time.
 */
async function _withTimeout(promise, timeout, message) {
  let timeoutId

  try {
    return await Promise.race([
      promise,
      new Promise((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(_createTimeoutError(message))
        }, timeout)
      }),
    ])
  } finally {
    clearTimeout(timeoutId)
  }
}

function _createTimeoutError(message, cause) {
  const error = new Error(message, {
    cause,
  })
  error.name = 'TimeoutError'
  error.code = 'ETIMEDOUT'
  return error
}

function _formatDuration(ms) {
  if (ms % (60 * 1000) === 0) {
    const minutes = ms / (60 * 1000)
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  if (ms % 1000 === 0) {
    const seconds = ms / 1000
    return `${seconds} second${seconds > 1 ? 's' : ''}`
  }

  return `${ms} ms`
}

/**
 * Fetches the checksum for a specific file from a remote checksum file.
 * @param {string} checksumUrl - The URL of the checksum file.
 * @param {string} fileName - The name of the file to get the checksum for.
 * @returns {string} checksum value for the given fileName in the checksum file at checksumUrl
 * @throws Error if the checksum file cannot be downloaded or if the checksum for the given fileName is not found
 */
async function _getRemoteChecksum(checksumUrl, fileName) {
  const checksumResponse = await fetch(checksumUrl)

  if (!checksumResponse.ok) {
    throw new Error(
      `Failed to download checksum file: HTTP ${checksumResponse.status}${
        checksumResponse.statusText ? ` ${checksumResponse.statusText}` : ''
      }`
    )
  }

  const checksumFile = await checksumResponse.text()
  const checksumLine = checksumFile.split('\n').find(line => line.endsWith(` ${fileName}`))

  if (checksumLine === undefined) {
    throw new Error(`Checksum not found for ${fileName}`)
  }

  return checksumLine.split(/\s+/)[0]
}

/**
 * Attaches a VDI to a VM.
 * @param {*} xapi - The XAPI client.
 * @param {*} vm - The VM object.
 * @param {*} vdi - The VDI object.
 * @param {*} sr - The SR object.
 */
async function _attachVDIToVM(xapi, vm, vdi, sr) {
  await xapi.VBD_create({
    VM: vm.$ref,
    VDI: vdi.$ref,
    bootable: true,
    mode: 'RW',
  })
}

/**
 * Installs the Xen Guest Agent on a VM using cloud-init. The agent is needed to have the VM report its IP address and to write data in the xenstore that will be used by the cluster configuration.
 * @param {*} xapi - The XAPI client.
 * @param {*} vm - The VM object.
 * @param {*} networkConfig - The network configuration to use for the VM, in cloud-init format.
 */
async function _installXenGuestAgent(xapi, vm, networkConfig) {
  const packageURL = 'https://gitlab.com/api/v4/projects/xen-project%252Fxen-guest-agent/packages/generic/deb-amd64/'
  const packageName = 'xen-guest-agent'
  const readyKey = 'vm-data/xen-guest-agent-ready'
  const cloudConfig =
    '#cloud-config\n' +
    YAML.stringify({
      apt: {
        sources: {
          [packageName]: {
            source: `deb [trusted=yes] ${packageURL} release/`,
          },
        },
      },
      package_update: true,
      package_upgrade: false,
      packages: [packageName, 'xenstore-utils'], // Also install xenstore-utils for xenstore-write command
      runcmd: [
        ['systemctl', 'daemon-reload'],
        ['systemctl', 'enable', '--now', packageName],
        ['xenstore-write', readyKey, 'true'],
      ],
    })
  await xapi.VM_createCloudInitConfig(vm.$ref, cloudConfig, YAML.stringify(networkConfig))

  try {
    await xapi.startVm(vm.$id)
  } catch (error) {
    throw new Error('Failed to start template VM for Xen Guest Agent installation', {
      cause: error,
    })
  }

  let installError

  try {
    await _withTimeout(
      xapi._waitObjectState(vm.$id, obj => obj.xenstore_data?.[readyKey] === 'true'),
      XEN_GUEST_AGENT_READY_TIMEOUT,
      `Timed out waiting for Xen Guest Agent readiness after ${_formatDuration(XEN_GUEST_AGENT_READY_TIMEOUT)}`
    )
  } catch (error) {
    installError = new Error('Failed while waiting for Xen Guest Agent readiness', {
      cause: error,
    })
  }

  try {
    await xapi.shutdownVm(vm.$id)
  } catch (error) {
    if (installError !== undefined) {
      throw await _cleanTemplateError(installError.message, installError, [], [`VM shutdown failed: ${error.message}`])
    }

    throw new Error('Failed to shutdown template VM after Xen Guest Agent installation', {
      cause: error,
    })
  }

  if (installError !== undefined) {
    throw installError
  }
}
