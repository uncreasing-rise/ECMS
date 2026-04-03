# ECMS Helm Chart

This chart deploys ECMS in microservice mode:
- API deployment (`dist/main.js`)
- Worker deployment (`dist/main-worker.js`)

## Install

```bash
helm upgrade --install ecms ./helm/ecms \
  --set image.repository=<your-image-repo> \
  --set image.tag=<your-tag> \
  --set env.DATABASE_URL='<postgres-url>' \
  --set env.JWT_SECRET='<jwt-secret>' \
  --set env.RABBITMQ_URL='amqp://user:pass@rabbitmq:5672'
```

## Optional

Enable ingress:

```bash
helm upgrade --install ecms ./helm/ecms \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=api.example.com
```

Enable API autoscaling:

```bash
helm upgrade --install ecms ./helm/ecms \
  --set autoscaling.enabled=true
```
