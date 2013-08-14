# Known bugs

XO is currently under development and contains various known bugs/limitations.

We will try to list the most important here so that you know what to expect if you try it and that we are planning to fix them :)

# No persistence

Each time you shutdown XO-Server, the configuration will be lost (added servers, users, etc.).

# VNC Console

The VNC console works on Firefox but not on Chromium, furthermore it has not been tested with other browsers.

There are also lots of minor bugs such as:
* Duplicate key inputs (refresh the page if it happens).
* Links on the navigation bar are sometimes unclickable.

# Non refresh-proof authentication

If you refresh the page, you have to re-authenticate yourself.
