#!/bin/bash
if [ ! -d $SERVICE_PATH/kubernetes/ ] 
then
  cd $SERVICE_PATH
  curl -L https://github.com/kubernetes/kubernetes/releases/download/v1.1.7/kubernetes.tar.gz > kubernetes.tar.gz
  tar xvf kubernetes.tar.gz
  cd kubernetes/cluster/vagrant
  cp $SERVICE_PATH/scripts/* $SERVICE_PATH/kubernetes/cluster/vagrant/
fi
cd $SERVICE_PATH/kubernetes/cluster 
KUBERNETES_PROVIDER=vagrant ./kube-up.sh

