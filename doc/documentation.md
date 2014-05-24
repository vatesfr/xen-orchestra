# Xen Orchestra documentation

## Introduction

## Architecture

This part is dedicated to the architecture of Xen Orchestra. It will give you a preview of how we build this software.

### Overview

Here is a diagram giving an overview of what is Xen Orchestra:
![](./assets/xo-arch.jpg)

Xen Orchestra is split in modules:
- the core is "xo-server", a daemon dealing directly with XenServer or XAPI capable hosts. This is where are stored users, and it's the center point for talking to your whole Xen infrastructure.
- the Web interface is in "xo-web": you are running it directly in your browser. The connection with "xo-server" is done via *WebSockets*
- "xo-cli" is a new module allowing to send order directly in command line

We will use this modular architecture to add further parts later. It's completely flexible, allowing us to adapt Xen Orchestra in every existing work-flow.

### XO-server

### XO-web

### XO-cli

### Other modules

## Installation

### Xen Orchestra Appliance

### Manual installation

## Administration

### Configuration

#### User to run XO-server as

#### HTTP port

#### HTTPS

#### Link to XO-web

### First connection

### Add Xen hosts

### Add users

## Layout

### Navigation bar

### Main view

### Flat view

## Usage

### Virtual machines

#### Life-cycle (stop, start, reboot)

#### Live migration

#### Console

#### Edit VM characteristics

#### Create a VM

#### Copy a VM

#### Create a template

#### Delete

#### Snapshots management

#### Disk management

#### Network (interface) management

#### Logs

#### Group actions

### Hosts

#### Life-cycle

#### Memory Map

#### Edit host characteristics

#### Restart tool-stack

#### Remove from pool

#### Host console

#### Attached storage repository

#### Network (interface) management

#### Pending tasks

#### Logs

### Storage repositories

#### Edit SR characteristics

#### VDI Map

#### Virtual disks management

##### Rescan the repository

#### Connected hosts

#### Logs

### Pools

#### Edit pool characteristics

#### Hosts list

#### Shared SR list

#### Logs
