## :dash: :dash: **The Binder Project is moving to a [new repo](https://github.com/jupyterhub/binderhub).** :dash: :dash:

:books: Same functionality. Better performance for you. :books:

Over the past few months, we've been improving Binder's architecture and infrastructure. We're retiring this repo as it will no longer be actively developed. Future development will occur under the [JupyterHub](https://github.com/jupyterhub/) organization.

* All development of the Binder technology will occur in the [binderhub repo](https://github.com/jupyterhub/binderhub)
* Documentation for *users* will occur in the [jupyterhub binder repo](https://github.com/jupyterhub/binder) 
* All conversations and chat for users will occur in the [jupyterhub binder gitter channel](https://gitter.im/jupyterhub/binder)

Thanks for updating your bookmarked links.

## :dash: :dash: **The Binder Project is moving to a [new repo](https://github.com/jupyterhub/binderhub).** :dash: :dash:

---

# binder-control
CLI for launching and managing binder server processes

`binder-control` is the main module for launching/managing all server-side Binder components. At
it's core, it's a fairly thin wrapper around the [PM2](https://github.com/Unitech/pm2)
process manager that also manages optional background services (a database, a logging stack,...)
using Docker Compose.

### Prerequisites

Make sure to install these services before proceeding with the installation:
 1. Node v5.7.1 (easiest to install through NVM)
   1. `wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash`
   2. `nvm install v5.7.1`
   3. `nvm use v5.7.1`
 2. [_PM2_](https://github.com/Unitech/pm2): `npm install pm2 -g`
 3. [_Docker_](https://docs.docker.com/linux/step_one/) (optional, for background services only)
 4. [_Docker Compose_](https://docs.docker.com/engine/installation/linux/ubuntulinux/) (optional, for background services only) 
 
If you want to use the local Kubernetes VM for testing, also install:
 1. [_Vagrant_](https://www.vagrantup.com/downloads.html)
 2. [_VirtualBox_](https://www.virtualbox.org/wiki/Downloads)

### Installation
`binder-control` is designed to be installed globally and used from the command line.

`npm install binder-control -g`

If you are running on a GCE instance, you'll first need to download/install the `gcloud` utility:

`curl https://sdk.cloud.google.com | bash`
`gcloud components update`

Then ensure that `gcloud` has the correct permissions to create new instances: 

`gcloud auth login`

### Getting Started

If you've created a new GCE instance specifically for Binder, and you'd like to proceed with the [default](conf/example.conf) configuration options, then `binder-control start-all` will
interactively launch all background services and Binder servers.

To interactively stop all services/services, call `binder-control stop-all`

### Services
`binder-control` provides built-in options for deploying the end-to-end system with either a local
version of Kubernetes (using Vagrant with VirtualBox), or with a small, preconfigured Kubernetes
cluster running on GCE.

#### Database

`binder-control start-service db`

The `db` service will launch a Docker container running Mongo DB (with other launch details
specified in the `binder-control` configuration file).

#### Logging

`binder-control start-service logging`

The `logging` service launches three Docker containers running the ELK stack (Elasticsearch,
Logstash and Kibana) for collecting and indexing log messages generated by other Binder components.
If you would like to use your own logging infrastructure (i.e. use an Elasticsearch cluster for
higher logging throughput), check out `binder-logging` for details on how to swap out the logging
service with your existing infrastructure.

#### Kubernetes VM

`binder-control start-service kube-vm`

The `kube-vm` service, launched with the command `binder-control start-service kube-vm`,
will spin up a virtual machine running Kubernetes, and will insert a `kubectl` binary onto your
path that can interface with this VM. This service depends on *VirtualBox* and *Vagrant*
(installation instructions [here](https://www.virtualbox.org/wiki/Linux_Downloads) and
[here](https://www.vagrantup.com/docs/installation/) respectively), which must be preinstalled
separately.

This Kubernetes VM will only be accessible on the local machine, and will not be accessible through
the `binder-web` interface -- it should only be used for testing `binder-deploy-kubernetes` during
development.

#### Kubernetes Cluster

`binder-control start-service kube-cluster`

The `kube-cluster` service will prompt the user for a set of cluster configuration parameters
(cloud provider, cluster size, etc.) before creating a Kubernetes cluster. The cluster creation 
process will take ~5 minutes, after which the standard Kubernetes control commands can be issued
through the [`kubectl.sh`](services/kube-cluster/kubernetes/cluster/kubectl.sh) script, which will
be downloaded the first time `kube-cluster` is started.

Stopping `kube-cluster` will permanently destroy the cluster, so make sure any important data (such
as data stored in Kubernetes volumes) are backed up.

_IMPORTANT: `kube-cluster` must be passed a desired cluster size, and creating a cluster with many nodes
can get very **expensive**. Checkout out the [GCE pricing guide](https://cloud.google.com/compute/pricing)
to make sure your cluster size matches your budget._


### Start

If you want to use the provided logging stack, DB infrastructure, or Kubernetes test VM, the very
first step is to launch these services using Docker Compose:

`binder-control start-service (db|logging|kubernetes)`

Once the services are all up and running, you can spin up the actual Binder servers...

with a single command, using default options:
`binder-control start-all`

or individually, with custom configuration files
`binder-control (build|deploy-kubernetes) start --api-key=<key> --config=/path/to/config`

#### Manage

All services and servers launched by `binder-control` are managed by the PM2 process manager.

To check on the status of all `binder-control` managed processes, see restart counts and uptime
information:
`pm2 list`

To see any console output or logging information:
`pm2 logs <process name>`

#### Stop

To stop background services, use the `stop-service` command
`binder-control stop-service (db|logging|kubernetes)`

To stop Binder servers, use the server name as the subcommand
`binder-control (build|deploy-kubernetes) stop`
