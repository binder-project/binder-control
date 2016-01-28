#!/bin/bash
echo "Waiting for Kubernetes cluster to become available..."

echo "PATH: " $PATH
echo "Running kubectl cluster-info..."
echo $(kubectl cluster-info)
until $(kubectl cluster-info &> /dev/null); do
    sleep 1
done

echo "Kubernetes cluster is up."
