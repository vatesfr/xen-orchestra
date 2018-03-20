# xo-server

XO-Server is the core of Xen Orchestra. Its central role opens a lot of possibilities versus other solutions. Let's see why.

### Daemon mode

As a daemon, XO-server is always up. In this way, it can listen and record every event occurring on your whole Xen infrastructure. Connections are always open and it can cache informations before serving it to another client (CLI, Web or anything else).

### Central point

Contrary to XenCenter, each Xen Orchestra's client is connected to one XO-Server, and not all the Xen servers. With a traditional architecture:

![](./assets/without-xo.jpg)

You can see how we avoid a lot of resources and bandwidth waste with a central point:

![](./assets/with-xo.jpg)

### Events

Legacy interfaces use the "pull" model, requesting data every "x" seconds:

![](./assets/noevent.jpg)

It's **not scalable** and slow.

With XO < 3.4, we used events in the following way:

![](./assets/semievent.jpg)

But the interface was still lagging behind the server. With XO 3.4, we now have a full event system, allowing instant display of what is happening on your infrastructure:

![](./assets/fullevent.jpg)

### A proxy for your hosts

XO-Server will act as a proxy for all your clients. This opens a lot of possibilities!

#### Console proxy

A good example is the console: you can now expose your consoles even if your clients are outside the network!

![](https://xen-orchestra.com/blog/content/images/2015/03/console_before.png)

![](https://xen-orchestra.com/blog/content/images/2015/03/console_after.png)

#### VM streaming

Another possibility is to stream a VM from a host to another.

To do that previously, you needed to export your VM somewhere, then re-import it:

![](https://xen-orchestra.com/blog/content/images/2015/10/oldsolution.png)

Thanks to our architecture, it's now far better:

![](https://xen-orchestra.com/blog/content/images/2015/10/newsolution.png)


#### Patching on the fly

To install a patch manually, you need a lot of steps: find, download, extract and apply the patch, sequentially.

"xo-server" can do all these steps once:

1. downloading automatically the patch on Citrix servers
2. unzipping it and uploading it on the fly to your host
3. applying it as soon it's done


### Pluggable

It's really easy to plug other modules to XO-server, and extend or adapt the solution to your needs (see XO-web and XO-cli for real examples).

#### ACLs

![](https://xen-orchestra.com/blog/content/images/2014/Aug/ldap.jpg)

![](https://xen-orchestra.com/blog/content/images/2014/Aug/permissions.jpg)

### API

An API is available to communicate directly with XO-Server. This part will be explained later.

### NodeJS under the hood

[NodeJS](https://en.wikipedia.org/wiki/Nodejs) is a software platform for scalable server-side and networking applications. It's famous for its efficiency, scalability and its asynchronous capabilities. Exactly what we need! Thus, XO-server is written in JavaScript.
