## Task logs

Rolling pool update and rolling pool reboot task logs have major parts in common.

### Rolling pool reboot

```
task.start({ name: 'Rolling pool reboot', poolId: string, poolName: string })
├─ task.start({ name: 'Restart hosts', total: number, progress: number })
|  ├─ task.start({ name: `Restarting host ${hostId}`, hostId: string, hostName: string })
|  |  ├─ task.start({ name: 'Evacuate', hostId: string, hostName: string })
│  │  │  └─ task.end
|  |  ├─ task.start({ name: 'Actions before reboot', hostId: string, hostName: string })
│  │  │  └─ task.end
|  |  ├─ task.start({ name: 'Restart', hostId: string, hostName: string })
│  │  │  └─ task.end
|  |  ├─ task.start({ name: 'Waiting host up', hostId: string, hostName: string })
│  │  │  └─ task.end
│  │  └─ task.end
│  └─ task.end
├─ task.start({ name: 'Migrate VMs back' })
|  ├─ task.start({ name: `Migrating VMs back to host ${hostId}`, hostId: string, hostName: string })
|  |  ├─ task.start({ name: `Migrating VM ${vmRef} back to host ${hostId}`, hostId: string, hostName: string, vmRef: string })
│  │  │  └─ task.end
│  │  └─ task.end
│  └─ task.end
└─ task.end
```

### Rolling pool update

```
task.start({ name: 'Rolling pool update', poolId: string, poolName: string })
├─ task.start({ name: 'Listing missing patches' })
│  └─ task.end
├─ task.start({ name: 'Updating and rebooting' })
│  ├─ task.start({ name: 'Restart hosts', total: number, progress: number })
│  |  ├─ task.start({ name: `Restarting host ${hostId}`, hostId: string, hostName: string })
│  |  |  ├─ task.start({ name: 'Evacuate', hostId: string, hostName: string })
│  │  │  │  └─ task.end
│  |  |  ├─ task.start({ name: 'Actions before reboot', hostId: string, hostName: string })
│  │  │  │  └─ task.end
│  |  |  ├─ task.start({ name: 'Restart', hostId: string, hostName: string })
│  │  │  │  └─ task.end
│  |  |  ├─ task.start({ name: 'Waiting host up', hostId: string, hostName: string })
│  │  │  │  └─ task.end
│  │  │  └─ task.end
│  │  └─ task.end
│  ├─ task.start({ name: 'Migrate VMs back' })
│  |  ├─ task.start({ name: `Migrating VMs back to host ${hostId}`, hostId: string, hostName: string })
│  |  |  ├─ task.start({ name: `Migrating VM ${vmRef} back to host ${hostId}`, hostId: string, hostName: string, │  vmRef: string })
│  │  │  │  └─ task.end
│  │  │  └─ task.end
│  │  └─ task.end
│  └─ task.end
└─ task.end
```
