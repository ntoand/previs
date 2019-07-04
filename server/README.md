# Previs web server

## Python packages

- futures
- imageio
- Pillow (>5.1.0)
- scipy
- nibabel
- pydicom

## nginx setup

To get real IP address from client, add following line to nginx config
```
proxy_set_header X-Real-IP $remote_addr;
``` 

The real IP address can be get in headers['x-real-ip']

Full nginx configuration used:
```
location / {
    proxy_pass http://localhost:9000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
}
```