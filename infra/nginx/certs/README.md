# Self-signed certs (INF-013, dev only)

Цей каталог монтується у контейнер nginx як `/etc/nginx/certs`. Реальні
сертифікати у git **НЕ комітимо** — вони генеруються один раз локально:

```bash
mkdir -p infra/nginx/certs
openssl req -x509 -nodes -newkey rsa:2048 \
  -days 365 \
  -keyout infra/nginx/certs/swipet.key \
  -out    infra/nginx/certs/swipet.crt \
  -subj   "/CN=localhost/O=Swipet/C=UA" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

В прод-середовищі замінити на сертифікат від Let's Encrypt
(окрема таска поза скоупом MVP).
