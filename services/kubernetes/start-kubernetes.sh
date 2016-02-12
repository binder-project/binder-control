#!/bin/bash
KUBECTL=$SERVICE_DIR/bin/kubectl
SINGLE_NODE=$SERVICE_DIR/coreos-kubernetes/single-node/
if [ ! -d $SERVICE_DIR/coreos-kubernetes/ ] 
then
  cd $SERVICE_DIR
  git clone https://github.com/coreos/coreos-kubernetes.git
  $KUBECTL config set-cluster vagrant-single-cluster --server=https://172.17.4.99:443 --certificate-authority=$SINGLE_NODE/ssl/ca.pem 
  $KUBECTL config set-credentials vagrant-single-admin --certificate-authority=$SINGLE_NODE/ssl/ca.pem --client-key=$SINGLE_NODE/ssl/admin-key.pem --client-certificate=$SINGLE_NODE/ssl/admin.pem
  $KUBECTL config set-context vagrant-single --cluster=vagrant-single-cluster --user=vagrant-single-admin 
  $KUBECTL config use-context vagrant-single
fi
cp $SERVICE_DIR/data/* $SINGLE_NODE
cd $SINGLE_NODE && vagrant up
echo "Sleeping for 30s to allow VM to start..."
sleep 30
KUBECONFIG=$SINGLE_NODE/kubeconfig $KUBECTL proxy --port=$KUBE_PROXY_PORT

