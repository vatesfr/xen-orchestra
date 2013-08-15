# Installation

As you may have seen, in other parts of the documentation, XO is composed of two parts: [XO-Server](https://github.com/vatesfr/xo-server/) and [XO-Web](https://github.com/vatesfr/xo-web/).

They can be installed separatly, even on different machines, but for the sake of simplicity we will set them up together.

## Fetching the Code

You may either download them [here](https://github.com/vatesfr/xo-server/archive/master.zip) and [here](https://github.com/vatesfr/xo-web/archive/master.zip) or use `git` with these repositories from `git://github.com/vatesfr/xo-server.git` and `git://github.com/vatesfr/xo-web.git`.

## Installing dependencies

The only dependency you have to install by yourself is [Node.js](http://nodejs.org). For more information you may check [this page](http://nodejs.org/download/).

Once you have it, you can use `npm` to install the other dependencies: go into XO-Server directory and launch the following command:

	npm install

## Making XO-Web accessible from XO-Server

XO-Server embeds an HTTP server which can be used to delivers XO-Web.

We are going to use this feature because it dispenses us from having to configure XO-Server's URL in XO-Web.

All you have to do is link all XO-Web's files in the `public/` directory from XO-Server's `public/http/` directory.

## Running XO

The sole part you have to launch is XO-Server which is quite easy to do, just launch the `xo-server` script.

You may now open http://localhost:8080/ and starts using it.

## All-in-one script

This script has been tested on Debian unstable, it may requires some adaptation for your system.

```bash
# Helpers for the script.
_have() { type "$1" 2> /dev/null >&2; }
if _have sudo; then
	_sudo() { sudo "$@"; }
elif _have su; then
	_sudo() { su "$@"; }
else
	_sudo() { "$@"; }
fi

## If you are not using Debian unstable, please refer to
## http://nodejs.org/download/
_sudo apt-get install git nodejs npm

# Installs everything in this directory, you may move it afterward.
mkdir /tmp/xo
cd /tmp/xo

# Fetches the Code.
git clone git://github.com/vatesfr/xo-server.git
git clone git://github.com/vatesfr/xo-web.git

# Installs dependencies.
cd xo-server
npm install
cd ..

# Makes XO-Web accessible from XO-Server.
cd xo-server/public/http
for e in ../../xo-web/public/*
do
	ln -s "$e"
done
cd ../../..

# Runs XO.
./xo-server/xo-server
```
