# 11. Kubernetes Deployment Guide

## 1. Overview
All manifests reside under the `/k8s` directory, split into service configurations (`/manifests`) and telemetry resources (`/observability`).

## 2. Kong Gateway ConfigMap Mount
In production, Kong requires its declarative config `kong.yml` to be loaded as a `ConfigMap`.
We create a ConfigMap representing `kong.yml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kong-config
data:
  kong.yml: |
    # Kong configuration yaml content...
```

This ConfigMap is mounted into the Kong Gateway container:
```yaml
spec:
  containers:
  - name: kong
    image: kong:3.4
    volumeMounts:
    - name: kong-config-volume
      mountPath: /usr/local/kong/declarative/
  volumes:
  - name: kong-config-volume
    configMap:
      name: kong-config
```

## 3. Deploy Command Sequence
Apply all configurations using `kubectl`:

1. **Deploy infrastructure (RabbitMQ & Keycloak)**:
   ```bash
   kubectl apply -f k8s/02-rabbitmq.yaml
   kubectl apply -f k8s/04-mocks.yaml
   ```
2. **Mount Kong Configurations and Deploy Gateway**:
   ```bash
   kubectl apply -f k8s/05-kong-ingress.yaml
   ```
3. **Deploy Microservices**:
   ```bash
   kubectl apply -f k8s/03-order-api.yaml
   ```
4. **Deploy Observability Stack**:
   ```bash
   kubectl apply -f k8s/06-observability.yaml
   ```
