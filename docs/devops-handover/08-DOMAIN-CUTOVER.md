# 08 — `aurahrms.com` domain cutover

Moving `aurahrms.com` off the dead DigitalOcean IP (`64.227.173.175`) onto a Global External
HTTPS Load Balancer in front of Cloud Run.

This exact procedure resolved a 20-day outage on `chinardeshpande.tech` in June 2026: managed
certificate went ACTIVE in ~6 minutes and the site returned with apex + www and an HTTP→HTTPS
redirect.

---

## 1. Why a Load Balancer here

- **Cloud Run domain mappings are not supported in `asia-south1`.** That alone forces the LB
  (or a Firebase front, which is ruled out below).
- **Socket.IO needs WebSockets.** The LB proxies them; Firebase Hosting's CDN does not do so
  reliably to a Cloud Run rewrite target.
- **Path routing keeps everything same-origin**, which removes CORS and cookie `SameSite`
  problems entirely.
- It is pure `gcloud` — no extra CLI to install, works from any machine.

**Cost:** ~$18/month for the forwarding rule + static IP. Per **R1a this must be the shared
portfolio LB**, with `aurahrms.com` added as a host — never a new AuraHRMS-only LB. If no
shared LB exists yet, this one becomes it, and future products join as additional hosts.

---

## 2. Build the load balancer

```bash
P=aurahrms-prod; REGION=asia-south1; N=aurahrms
APEX=aurahrms.com; WWW=www.aurahrms.com

# 1. static global IP
gcloud compute addresses create ${N}-lb-ip --global --project=$P

# 2. serverless NEGs -> the two Cloud Run services
gcloud compute network-endpoint-groups create ${N}-api-neg --region=$REGION \
  --network-endpoint-type=serverless --cloud-run-service=aurahrms-api --project=$P
gcloud compute network-endpoint-groups create ${N}-web-neg --region=$REGION \
  --network-endpoint-type=serverless --cloud-run-service=aurahrms-web --project=$P

# 3. backend services
gcloud compute backend-services create ${N}-api-backend --global \
  --load-balancing-scheme=EXTERNAL_MANAGED --project=$P
gcloud compute backend-services add-backend ${N}-api-backend --global \
  --network-endpoint-group=${N}-api-neg --network-endpoint-group-region=$REGION --project=$P
gcloud compute backend-services create ${N}-web-backend --global \
  --load-balancing-scheme=EXTERNAL_MANAGED --project=$P
gcloud compute backend-services add-backend ${N}-web-backend --global \
  --network-endpoint-group=${N}-web-neg --network-endpoint-group-region=$REGION --project=$P

# 4. url map: default -> web, /api/** and /socket.io/** -> api
gcloud compute url-maps create ${N}-urlmap --default-service=${N}-web-backend --global --project=$P
gcloud compute url-maps add-path-matcher ${N}-urlmap --global --project=$P \
  --path-matcher-name=api-matcher \
  --default-service=${N}-web-backend \
  --backend-service-path-rules='/api/*='${N}'-api-backend,/socket.io/*='${N}'-api-backend' \
  --new-hosts=$APEX,$WWW

# 5. Google-managed certificate (apex + www)
gcloud compute ssl-certificates create ${N}-cert --domains=$APEX,$WWW --global --project=$P

# 6. HTTPS proxy + 443 forwarding rule
gcloud compute target-https-proxies create ${N}-https-proxy \
  --url-map=${N}-urlmap --ssl-certificates=${N}-cert --global --project=$P
gcloud compute forwarding-rules create ${N}-https-fr --global \
  --target-https-proxy=${N}-https-proxy --address=${N}-lb-ip --ports=443 \
  --load-balancing-scheme=EXTERNAL_MANAGED --project=$P

# 7. HTTP -> HTTPS redirect (needs an IMPORTed url-map; there is no pure-flag form)
cat > /tmp/${N}-redirect.yaml <<YAML
name: ${N}-redirect
defaultUrlRedirect:
  httpsRedirect: true
  redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
  stripQuery: false
YAML
gcloud compute url-maps import ${N}-redirect --global --source=/tmp/${N}-redirect.yaml -q --project=$P
gcloud compute target-http-proxies create ${N}-http-proxy --url-map=${N}-redirect --global --project=$P
gcloud compute forwarding-rules create ${N}-http-fr --global \
  --target-http-proxy=${N}-http-proxy --address=${N}-lb-ip --ports=80 \
  --load-balancing-scheme=EXTERNAL_MANAGED --project=$P

# the IP to put in DNS:
gcloud compute addresses describe ${N}-lb-ip --global --project=$P --format='value(address)'
```

> Verify the path-matcher syntax against the installed `gcloud` version before relying on it —
> flag names in `add-path-matcher` have shifted between releases. If it rejects the flags,
> export the url-map to YAML, edit, and `import` it. Do not guess and move on.

---

## 3. Test through the LB *before* touching DNS

The LB serves on its IP immediately; only the certificate waits for DNS. Test with a forced
host header over the (temporarily untrusted) TLS endpoint:

```bash
IP=$(gcloud compute addresses describe ${N}-lb-ip --global --project=$P --format='value(address)')
curl -sk -o /dev/null -w "web %{http_code}\n"  --resolve "$APEX:443:$IP" "https://$APEX/"
curl -sk -o /dev/null -w "api %{http_code}\n"  --resolve "$APEX:443:$IP" "https://$APEX/health"
```

Both must be 200 **before** DNS moves. This is the difference between a 5-minute cutover and
an outage.

---

## 4. DNS cutover (Chinar's action, at the registrar)

Point **both** apex and www at the LB IP as **A records**, replacing the dead
`64.227.173.175`:

```
aurahrms.com        A   <LB_IP>
www.aurahrms.com    A   <LB_IP>
```

Both must resolve to the LB or the managed certificate will not validate.

**Lower the TTL to 300s a day beforehand if possible** — it makes rollback fast. (If the
registrar's current TTL is long, that is a constraint to know *before* cutover, not after.)

---

## 5. Verify

```bash
# authoritative nameserver, bypassing caches:
dig +short @<registrar-ns> aurahrms.com A          # expect <LB_IP>
dig +short @<registrar-ns> www.aurahrms.com A      # expect <LB_IP>

# certificate:
gcloud compute ssl-certificates describe ${N}-cert --global --project=$P \
  --format='value(managed.status)'                # want ACTIVE

# live:
curl -s -o /dev/null -w "%{http_code}\n" https://aurahrms.com/health          # 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://aurahrms.com/ # 301 -> https
```

The certificate sits in `PROVISIONING` until DNS resolves, then flips to `ACTIVE` — often
5–15 minutes, occasionally over an hour. **Right at the moment it flips, the HTTPS front-ends
take a couple more minutes to settle; an immediate probe can return `000`. Retry before
concluding anything is wrong.**

---

## 6. App-side checklist

- `CORS_ORIGIN=https://aurahrms.com` (or drop CORS entirely — the LB makes it same-origin).
- `BACKEND_URL` / `FRONTEND_URL` set to `https://aurahrms.com`.
- The web image is rebuilt with `VITE_API_URL=/api` and `VITE_SOCKET_URL=/` (relative, so the
  bundle is domain-agnostic).
- Cookies: `Secure`, `HttpOnly`, `SameSite=Lax` — the app is now HTTPS-only.
- No OAuth redirect-URI change is needed: AuraHRMS uses JWT credentials login, not a Google
  OAuth login flow. **Verify** this before telling anyone otherwise.

---

## 7. Rollback

| Situation | Action |
|---|---|
| Bad app revision | `gcloud run services update-traffic aurahrms-api --to-revisions=<PREV>=100 --region=$REGION --project=$P` |
| Bad LB routing | Re-import the previous url-map YAML |
| Cutover must be abandoned | Repoint DNS back — but note the **droplet is dead**, so there is nothing to roll back *to*. Forward-only. |

That last row matters: this is a one-way cutover. There is no working fallback host. Which is
exactly why §3 (test through the LB before DNS) is not optional.

---

## 8. Teardown (only if abandoning the LB)

Delete in reverse: forwarding rules → target proxies → url maps → ssl certificate → backend
services → NEGs → address. **The reserved static IP keeps billing until it is released.**
