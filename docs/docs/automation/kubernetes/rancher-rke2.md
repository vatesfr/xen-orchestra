---
sidebar_position: 2
---

# Use the CCM with Rancher RKE2

## Introduction

[RKE2](https://docs.rke2.io/) is the Kubernetes distribution from SUSE Rancher. This page explains how to deploy an RKE2 cluster on XCP-ng VMs that uses the [Xen Orchestra Cloud Controller Manager](https://github.com/vatesfr/xenorchestra-cloud-controller-manager) (CCM), so that your nodes are initialized, labeled and cleaned up from Xen Orchestra.

:::tip
To deploy a MicroK8s cluster with the CCM already set up, use the [Kubernetes recipe](./recipes.md) instead.
:::

To make RKE2 use the Xen Orchestra CCM, you need to:

1. disable the cloud controller manager embedded in RKE2
2. run the kubelet with `cloud-provider=external`
3. install the CCM Helm chart through an RKE2 Helm add-on, with `spec.bootstrap: true`

These steps follow the RKE2 documentation on [deploying an external cloud controller manager](https://docs.rke2.io/networking/networking_services#deploying-an-external-cloud-controller-manager).

## Before you start

Make sure you have:

- the VMs that will become your RKE2 server and agent nodes, not yet running RKE2
- a Xen Orchestra instance reachable from these VMs, via an FQDN or an IP address
- a Xen Orchestra [authentication token](../restapi.md#creation) for the CCM

:::warning
Tokens expire. Renew the CCM token before it does, or the CCM stops working: see [Refreshing the API token](./recipes.md#refreshing-the-api-token).
:::

## Install the server node

Do these steps **before** installing RKE2 on the node:

1. Create the RKE2 configuration file, `/etc/rancher/rke2/config.yaml`:

   ```yaml
   # /etc/rancher/rke2/config.yaml
   disable-cloud-controller: true
   kubelet-arg: cloud-provider=external
   ```

2. Create a manifest that installs the CCM Helm chart while the cluster bootstraps, in `/var/lib/rancher/rke2/server/manifests` (see [Automatically deploying manifests and Helm charts](https://docs.rke2.io/add-ons/helm#automatically-deploying-manifests-and-helm-charts)):

   ```yaml
   # /var/lib/rancher/rke2/server/manifests/xenorchestra-ccm.yaml
   apiVersion: helm.cattle.io/v1
   kind: HelmChart
   metadata:
     name: xenorchestra-ccm
     namespace: kube-system
   spec:
     chart: oci://ghcr.io/vatesfr/charts/xenorchestra-cloud-controller-manager
     targetNamespace: kube-system
     bootstrap: true
     valuesContent: |-
       # Xen Orchestra connection
       config:
         url: "<xo-url>"
         token: "<xo-token>"
         insecure: false
   ```

   Replace `<xo-url>` with the URL of your Xen Orchestra instance and `<xo-token>` with your authentication token.

   :::note
   If the instance uses a self-signed HTTPS certificate, set `insecure` to `true`.
   :::

3. Install RKE2 by following the official [RKE2 Quickstart](https://docs.rke2.io/install/quickstart).

:::info
`bootstrap: true` lets the CCM start before the cluster is fully ready. Without it, the nodes would stay tainted as uninitialized, waiting for a cloud provider that never starts.
:::

## Install the agent (worker) nodes

Agent nodes need the same configuration as the server node, plus the address of the server and its join token:

1. Create `/etc/rancher/rke2/config.yaml`:

   ```yaml
   # /etc/rancher/rke2/config.yaml
   server: https://<server>:9345
   token: <token from server node>
   disable-cloud-controller: true
   kubelet-arg: cloud-provider=external
   ```

2. Follow the official [RKE2 Quickstart](https://docs.rke2.io/install/quickstart) to install a Linux agent (worker) node.

You don't need the Helm chart manifest on agent nodes: the CCM is deployed once, from the server node.

## Add the Xen Orchestra CSI driver

To provision persistent volumes on your XCP-ng storage, install the [Xen Orchestra CSI driver](https://github.com/vatesfr/xenorchestra-csi-driver) by following its [installation guide](https://github.com/vatesfr/xenorchestra-csi-driver/blob/main/docs/install.md).

## Related links

- [Xen Orchestra Cloud Controller Manager](https://github.com/vatesfr/xenorchestra-cloud-controller-manager)
- [Xen Orchestra CSI driver](https://github.com/vatesfr/xenorchestra-csi-driver)
- [RKE2 official documentation](https://docs.rke2.io/)
