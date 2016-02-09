#!/bin/bash
if [ ! -d $SERVICE_PATH/kubernetes/ ] 
then
  cd $SERVICE_PATH
  curl -L https://github.com/kubernetes/kubernetes/releases/download/v1.1.7/kubernetes.tar.gz > kubernetes.tar.gz
  tar xvf kubernetes.tar.gz
  cd kubernetes/cluster/vagrant
fi
cp $SERVICE_PATH/scripts/* $SERVICE_PATH/kubernetes/cluster/vagrant/
cd $SERVICE_PATH/kubernetes/cluster 
KUBERNETES_PROVIDER=vagrant ./kube-up.sh
PATH=$PATH:$SERVICE_PATH/bin kubectl proxy --port=$KUBE_PROXY_PORT

