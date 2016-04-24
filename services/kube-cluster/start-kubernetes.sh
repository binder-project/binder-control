#!/bin/bash
KUBE_DIR=$SERVICE_DIR/kubernetes
if [ ! -d $KUBE_DIR ]; then
  wget https://github.com/kubernetes/kubernetes/releases/download/v1.2.2/kubernetes.tar.gz
  tar xvf kubernetes.tar.gz -C $SERVICE_DIR
  rm kubernetes.tar.gz
fi

echo "KUBE_DIR: " $KUBE_DIR
$KUBE_DIR/cluster/kube-up.sh
$KUBE_DIR/cluster/kubectl.sh proxy --port=$API_SERVER_PORT &
