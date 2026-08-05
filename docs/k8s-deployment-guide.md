# Kubernetes Deployment Guide

## Namespace Setup
Apply namespace details:
```bash
kubectl apply -f k8s/00-namespace.yaml
```

## Mounting ConfigMaps & Secrets
Register environments and configurations:
```bash
kubectl apply -f k8s/01-configmap-secrets.yaml
```

## Deploying Middleware and Services
Boot components in sequence:
```bash
kubectl apply -f k8s/02-rabbitmq.yaml
kubectl apply -f k8s/03-order-api.yaml
kubectl apply -f k8s/04-mocks.yaml
kubectl apply -f k8s/05-kong-ingress.yaml
kubectl apply -f k8s/06-observability.yaml
```
