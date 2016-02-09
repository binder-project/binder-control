#!/bin/bash
if [ ! -d $SERVICE_DIR/kubernetes/ ] 
then
  cd $SERVICE_DIR
  curl -L https://github.com/kubernetes/kubernetes/releases/download/v1.1.7/kubernetes.tar.gz > kubernetes.tar.gz
  tar xvf kubernetes.tar.gz
fi
cp $SERVICE_DIR/scripts/* $SERVICE_DIR/kubernetes/cluster/vagrant/
export KUBERNETES_PROVIDER=vagrant 
$SERVICE_DIR/kubernetes/cluster/kube-up.sh
PATH=$PATH:$SERVICE_DIR/bin kubectl proxy --port=$KUBE_PROXY_PORT

