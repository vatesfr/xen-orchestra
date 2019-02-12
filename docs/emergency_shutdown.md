# Emergency Shutdown

If you have a UPS for your hosts, and lose power, you may have a limited amount of time to shut down all of your VM infrastructure before the batteries run out. If you find yourself in this situation, or any other situation requiring the fast shutdown of everything, you can use the **Emergency Shutdown** feature.

## How to activate
On the host view, clicking on this button will trigger the  _Emergency Shutdown_ procedure:

![](./assets/e-shutdown-1.png)

1.  **All running VMs will be suspended**  (think of it like "hibernate" on your laptop: the RAM will be stored in the storage repository).
2.  Only after this is complete, the host will be halted.

Here, you can see the running VMs are being suspended:

![](./assets/e-shutdown-2.png)

And finally, that's it. They are cleanly shut down with the RAM saved to disk to be resumed later:

![](./assets/e-shutdown-3.png)

Now the host is halted automatically.

## Powering back on
When the power outage is over, all you need to do is:

1.  Start your host.
2.  All your VMs can be resumed, your RAM is preserved and therefore your VMs will be in the exact same state as they were before the power outage.
