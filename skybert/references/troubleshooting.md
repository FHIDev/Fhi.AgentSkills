# Feilsøking

## Vanlige problemer

### 1. Pod starter ikke (ImagePullBackOff)
```bash
# Sjekk ACR-tilgang
kubectl describe pod <pod-name> -n tn-<tenant>

# Verifiser Workload Identity
kubectl get serviceaccount <tenant>-azure -n tn-<tenant> -o yaml
```

### 2. Ingress fungerer ikke
```bash
# Sjekk ingress-status
kubectl get ingress -n tn-<tenant>
kubectl describe ingress <ingress-name> -n tn-<tenant>

# Verifiser DNS
nslookup <tenant>.skytest.fhi.no
```

### 3. Azure Key Vault secrets ikke tilgjengelig
```bash
# Sjekk ExternalSecret-status
kubectl get externalsecrets -n tn-<tenant>
kubectl describe externalsecret <name> -n tn-<tenant>

# Sjekk om Secret ble opprettet
kubectl get secrets -n tn-<tenant>

# Sjekk pod events
kubectl describe pod <pod-name> -n tn-<tenant>
```

### 4. Flux synkroniserer ikke

Flux rekonsilerer automatisk hvert 2. minutt. Vent opptil 2 minutter etter at GitHub workflow lykkes.

Hvis endringer fortsatt ikke vises etter 5 minutter:
1. Verifiser at `oci-push.yaml` workflow fullførte uten feil
2. Sjekk at OCI-artifaktet ble pushet til ACR
3. Kontakt plattformteamet (#ext-fhi-skybert) - de kan sjekke Flux-status og tvinge rekonsiliering

### 5. Nettverkstilkobling feiler (rød sone)
```bash
# Verifiser NetworkPolicy
kubectl get networkpolicy -n tn-<tenant>
kubectl describe networkpolicy <policy-name> -n tn-<tenant>

# Test tilkobling fra pod
kubectl exec -it <pod-name> -n tn-<tenant> -- curl <url>
```

### 6. URL viser feil eller gammel app

**Symptomer:**
- Du har deployet appen, men URL-en viser en annen/gammel versjon
- Eller URL-en viser ingenting selv om pod kjører
- GitOps-repo og workflows ser riktige ut

**Årsak:**
Flere GitOps-repoer eller deployments peker på samme hostname. Den gamle deploymenten "eier" ingressen.

**Løsning:**
Kontakt Skybert-teamet (#ext-fhi-skybert) for å fjerne den gamle deploymenten. Du kan ikke overskrive dette selv - det krever at noen med cluster-tilgang sletter den eksisterende ressursen.

**Verifisering:**
```bash
# Sjekk at riktig image kjører
kubectl describe pod <pod-name> -n tn-<tenant> | grep Image

# Sjekk hvilken service ingressen peker på
kubectl describe ingress -n tn-<tenant>
```

### 7. oci-push.yaml trigges ikke automatisk

**Symptomer:**
- `update-tag.yaml` kjører OK og oppdaterer skybertapp.yaml
- `oci-push.yaml` kjører IKKE etterpå (selv om den har `on: push: branches: [main]`)

**Årsak:**
GitHub Actions sikkerhet forhindrer at workflows trigget av `GITHUB_TOKEN` kan trigge andre workflows.

**Løsning:**
Bruk PAT i checkout-steget i `update-tag.yaml`:
```yaml
- uses: actions/checkout@v4
  with:
    token: ${{ secrets.GH_PAT }}  # KRITISK!
```

**Sjekkliste:**
```bash
# 1. Verifiser at GH_PAT secret finnes i GitOps-repo
# Settings → Secrets → Repository secrets → GH_PAT

# 2. Verifiser at PAT har riktige scopes:
# - repo (full control)
# - workflow (update GitHub Actions workflows)

# 3. Sjekk at PAT ikke er utløpt (vanligvis 90 dager)

# 4. Verifiser at update-tag.yaml bruker PAT:
grep -A2 "uses: actions/checkout" .github/workflows/update-tag.yaml
# Skal vise: token: ${{ secrets.GH_PAT }}
```

### 8. kubectl fungerer ikke / tilkoblingsfeil

**Symptomer:**
- `dial tcp 127.0.0.1:47011: connectex: No connection could be made`
- `Unable to connect to the server`

**Årsak:**
Skybert bruker Azure Arc-connected Kubernetes, ikke vanlig AKS. Du må bruke `az connectedk8s proxy`.

**Løsning:**
```powershell
# Start proxy i egen terminal (må holdes åpen)
az connectedk8s proxy --resource-group rg-fhi-aks-yellow-test-weu-01 --name aks-yellow-test-01 --subscription 09fc3dd5-8ce9-4951-a7a6-49f95b871cbd

# Kjør kubectl i annen terminal
kubectl get pods -n tn-<tenant>
```

### 9. "User does not have access to the resource" i namespace "default"

**Symptomer:**
- Forbidden-feil når du kjører kubectl-kommandoer
- Feilmelding nevner namespace "default"

**Årsak:**
Du har kun tilgang til ditt eget namespace (`tn-<tenant>`), ikke default namespace.

**Løsning:**
```powershell
# Sett default namespace
kubectl config set-context --current --namespace=tn-<tenant>

# Eller bruk -n flagget
kubectl get pods -n tn-<tenant>
```

### 10. Kan ikke pulle images fra ACR lokalt

**Symptomer:**
- `az acr login --name crfhiskybert` sier "Login Succeeded"
- `docker pull crfhiskybert.azurecr.io/...` feiler med "pull access denied" eller "repository does not exist"

**Årsak:**
Du mangler AcrPull-rettighet på ACR-en. Feilmeldingen "repository does not exist" er misvisende - den betyr vanligvis at du ikke har tilgang (ACR skjuler dette av sikkerhetsgrunner).

**Løsning:**
Kontakt Skybert-teamet på #ext-fhi-skybert:

```
Hei! Kan jeg få tilgang til å pulle images fra crfhiskybert.azurecr.io?
Bruker: <din-epost>
Image: <tenant>/<tenant>_test
```

**Verifisering etter tilgang er gitt:**
```powershell
# Logg inn på nytt
az login
az acr login --name crfhiskybert

# Test pull
docker pull crfhiskybert.azurecr.io/<tenant>/<tenant>_test:<tag>
```

## Debug-kommandoer

**Viktig:** Husk ALLTID `-n tn-<tenant>` eller sett default namespace først.

```powershell
# Sett default namespace (gjør dette først!)
kubectl config set-context --current --namespace=tn-<tenant>

# Få pod-logger
kubectl logs <pod-name> -n tn-<tenant>

# Follow logs
kubectl logs -f <pod-name> -n tn-<tenant>

# Exec inn i pod
kubectl exec -it <pod-name> -n tn-<tenant> -- /bin/sh

# Port-forward for lokal testing
kubectl port-forward <pod-name> 8080:8080 -n tn-<tenant>

# Describe ressurs
kubectl describe <resource-type> <resource-name> -n tn-<tenant>

# Se alle ressurser
kubectl get all -n tn-<tenant>

# Se ingress
kubectl get ingress -n tn-<tenant>

# Se events (nyttig for feilsøking)
kubectl get events -n tn-<tenant> --sort-by='.lastTimestamp'

# Se ressursbruk
kubectl top pods -n tn-<tenant>
```
