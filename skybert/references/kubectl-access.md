# Kubectl-tilgang til Skybert

## Forutsetninger
1. Azure CLI installert
2. Tilgangspakke via myaccess.microsoft.com (f.eks. `FHI - Skybert - <Tenant>-Test-Yellow`)
3. Innlogget med `az login`

## Koble til klusteret

**Viktig:** Du kan IKKE bruke `az aks get-credentials` - Skybert bruker Azure Arc-connected Kubernetes.

**Steg 1: Start proxy (hold denne terminalen åpen)**
```powershell
# Gul sone test
az connectedk8s proxy --resource-group rg-fhi-aks-yellow-test-weu-01 --name aks-yellow-test-01 --subscription 09fc3dd5-8ce9-4951-a7a6-49f95b871cbd

# Gul sone prod
az connectedk8s proxy --resource-group rg-fhi-aks-yellow-prod-weu-01 --name aks-yellow-prod-01 --subscription c0b8ff18-a1bc-4390-ba6d-a9c252e86252
```

Proxyen kjører på port 47011 og MÅ holdes åpen mens du bruker kubectl.

**Steg 2: Åpne ny terminal og kjør kubectl**
```powershell
# Sett default namespace (anbefalt)
kubectl config set-context --current --namespace=tn-<tenant>

# Eller bruk -n flagget på hver kommando
kubectl get pods -n tn-<tenant>
```

## Nyttige kubectl-kommandoer

**Viktig:** Husk ALLTID å spesifisere namespace med `-n tn-<tenant>` eller sett default namespace først.

```powershell
# Se pods
kubectl get pods -n tn-<tenant>

# Se alle ressurser
kubectl get all -n tn-<tenant>

# Se logger
kubectl logs <pod-name> -n tn-<tenant>

# Follow logs
kubectl logs -f <pod-name> -n tn-<tenant>

# Se ingress/URL
kubectl get ingress -n tn-<tenant>

# Describe pod for feilsøking
kubectl describe pod <pod-name> -n tn-<tenant>

# Port-forward for lokal testing
kubectl port-forward <pod-name> 8080:8080 -n tn-<tenant>

# Exec inn i pod
kubectl exec -it <pod-name> -n tn-<tenant> -- /bin/sh
```

## k9s - Terminal UI for Kubernetes

k9s er et kraftig terminal-basert UI som gjør det enklere å navigere og administrere Kubernetes-ressurser.

### Installasjon
```powershell
# Windows (winget)
winget install k9s

# Windows (scoop)
scoop install k9s

# macOS
brew install derailed/k9s/k9s
```

### Bruk med Skybert

1. Start proxy i én terminal (må holdes åpen):
   ```powershell
   az connectedk8s proxy --resource-group rg-fhi-aks-yellow-test-weu-01 --name aks-yellow-test-01 --subscription 09fc3dd5-8ce9-4951-a7a6-49f95b871cbd
   ```

2. Start k9s i en annen terminal:
   ```powershell
   # Start k9s direkte i ditt namespace
   k9s -n tn-<tenant>

   # Eller start k9s og naviger manuelt
   k9s
   ```

### k9s-kommandoer

| Tast | Funksjon |
|------|----------|
| `:ns` | Bytt namespace |
| `:pod` | Vis pods |
| `:svc` | Vis services |
| `:ing` | Vis ingresses |
| `:deploy` | Vis deployments |
| `l` | Se logger for valgt pod |
| `s` | Shell inn i valgt pod |
| `d` | Describe valgt ressurs |
| `ctrl+d` | Slett valgt ressurs |
| `/` | Søk/filtrer |
| `esc` | Gå tilbake |
| `ctrl+c` | Avslutt k9s |

**Tips:**
- Bruk `0` for å se alle namespaces du har tilgang til
- Trykk `?` for hjelp og alle hurtigtaster
- k9s husker siste namespace mellom sesjoner

## Vanlige feil ved kubectl-tilkobling

**Feil: "dial tcp 127.0.0.1:47011: connectex: No connection could be made"**
- Årsak: Proxyen kjører ikke
- Løsning: Start `az connectedk8s proxy ...` i en egen terminal

**Feil: "AuthorizationFailed" ved `az aks get-credentials`**
- Årsak: Skybert bruker IKKE vanlig AKS
- Løsning: Bruk `az connectedk8s proxy` i stedet

**Feil: "User does not have access to the resource" i namespace "default"**
- Årsak: Du kjører kubectl uten å spesifisere namespace
- Løsning: Legg til `-n tn-<tenant>` eller sett default namespace

## Kjøre container lokalt fra ACR

For å teste samme image som kjører i Skybert lokalt på utvikler-PC.

### Forutsetninger
- Docker Desktop installert og kjørende
- Azure CLI (`az`) installert
- AcrPull-tilgang til `crfhiskybert.azurecr.io` (ikke gitt automatisk - se feilsøking)

### Kommandoer

```powershell
# 1. Logg inn på Azure
az login

# 2. Autentiser mot ACR
az acr login --name crfhiskybert

# 3. Pull imaget
docker pull crfhiskybert.azurecr.io/<tenant>/<tenant>_test:<tag>

# 4. Kjør containeren
docker run -p 8080:8080 crfhiskybert.azurecr.io/<tenant>/<tenant>_test:<tag>
```

Appen er da tilgjengelig på **http://localhost:8080**

### Alternativ: Bygg lokalt fra kildekode

Hvis du ikke har ACR-tilgang ennå, kan du bygge fra kildekoden:

```powershell
docker build -t <tenant> .
docker run -p 8080:8080 <tenant>
```
