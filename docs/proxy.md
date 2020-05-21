# Backup Proxy

A Xen Orchestra proxy is an architecture component you can deploy in an infrastructure in order to handle the data stream of your backup job.
The most current situation in which you might wish to use a XO proxy are:

- To handle backup data stream in large infrastructure to avoid saturation of the main appliance and split the workload
- To handle backup data stream in remote infrastructure to avoid useless back and forth from the main XOA to the remote location

![](https://xen-orchestra.com/blog/content/images/2019/04/Paper.Vates.2019.04.13-2-1-1.png)

## Deployment

### Prerequisites

To deploy Xen Orchestra proxies, you need to have an available proxy license. To purchase a license, you simply need to go on [our store](https://xen-orchestra.com/#!/member/purchaser) and follow the process.

### Minimum Requirements

XO proxies will require this ressources available:

- 2 vCPUs
- 2GiB RAM
- 20GiB disk (2GiB on thin pro SR)

### Installation

1. Go in the proxies section of your appliance

![](./assets/proxy-section.png)

2. Deploy a proxy in your infrastructure

![](https://user-images.githubusercontent.com/21563339/80114306-b6110480-8583-11ea-8722-83f22e5be778.png)

3. Do all the required configuration for your proxy (SR, network...)

![](https://user-images.githubusercontent.com/21563339/80114537-fe302700-8583-11ea-9bf5-598e0b143021.png)

4. If you have an available license, it will be automatically bind to your new proxy deployed.

## Proxy Remote creation

Once a proxy is deployed in your infrastructure, you can create a proxy remote using the remote form.

![](https://user-images.githubusercontent.com/21563339/80117316-54529980-8587-11ea-9721-8a1d61293efe.png)
![](https://user-images.githubusercontent.com/21563339/80117185-23726480-8587-11ea-8136-50a8d98b4a5a.png)

## Backup job with Proxy

While creating a standard backup job from your main Xen Orchestra appliance, you will have the ability to select a proxy on which you want to execute the job.

![](https://user-images.githubusercontent.com/21563339/80116365-29b41100-8586-11ea-9746-e01ca3e53996.png)
