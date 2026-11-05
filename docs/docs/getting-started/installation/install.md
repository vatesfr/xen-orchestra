---
slug: /getting-started/install
sidebar_label: Installation
---

# Installing Xen Orchestra

You can install Xen Orchestra in two ways: deploy **XOA**, the Xen Orchestra Appliance, or build Xen Orchestra yourself **from source**. Both give you Xen Orchestra and its web interfaces; they differ in how XO is packaged, kept up to date and supported.

Whichever method you choose, first check the [requirements](../requirements.md).

## Which method should I choose?

|                    | XOA                                                                          | From source                                                        |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **What you get**   | A pre-built VM, deployed on one of your hosts in a few minutes               | A build of the Git repository, on a machine you prepare yourself   |
| **Updates**        | [Built-in updater](../updater.md), from the web interface | `git pull` and rebuild, by hand                                    |
| **Quality**        | Every release is tested, as part of a controlled environment                 | No QA beyond what the community reports                            |
| **Support**        | Professional support with a Vates VMS bundle, best-effort tickets with XOA Free | [Community support](../../support-and-reference/community.md) only |
| **Best for**       | Production, and anyone who wants Xen Orchestra to just work                   | Home labs, evaluation, contributing to Xen Orchestra               |

### XOA, the recommended method

XOA is the way Vates recommends to run Xen Orchestra, and the only one with professional support. Deploying it takes a few minutes and installs nothing on your hosts: XOA is just another VM. Once it is registered, you can start a free 30-day trial of the complete feature set; afterwards, it keeps working with the Free feature set if you do not subscribe.

[Install XOA](xoa.md)

### From source, for labs and evaluation

Xen Orchestra is fully open source: you can build and run it yourself, for free, on a machine you control (the procedure is validated on Debian). You are then in charge of its dependencies, its updates and its troubleshooting, with the help of the community.

[Install Xen Orchestra from source](install-from-sources.md)

## Not sure?

Start with XOA. If you plan to use Xen Orchestra in production, it is the method we recommend, and the trial lets you evaluate every feature before deciding. For more on support options, see [Support](../../support-and-reference/intro_support.md).
