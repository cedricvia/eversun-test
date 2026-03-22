# Déploiement Vercel - Configuration requise

## Variables d'environnement

Dans le dashboard Vercel, ajoutez ces variables d'environnement :

### 1. MONGO_URI (Obligatoire)
```
MONGO_URI=mongodb+srv://votre_username:votre_password@cluster.mongodb.net/database_name
```

### 2. VITE_API_URL (Optionnel)
```
VITE_API_URL=/api
```

## Architecture

Ce projet utilise l'architecture serverless de Vercel :
- Les fonctions API sont dans `/api/*.js`
- Le dossier `/server` n'est pas utilisé en production
- Les appels `/api/*` sont redirigés vers les fonctions serverless

## Dépannage

### Si l'ajout/import de clients ne fonctionne pas :

1. **Vérifiez MONGO_URI** : Assurez-vous que la variable d'environnement est correctement configurée dans Vercel
2. **Logs Vercel** : Consultez les logs de fonction pour voir les erreurs MongoDB
3. **Permissions MongoDB** : Vérifiez que l'utilisateur MongoDB a les permissions d'écriture

### Mode démo

Si MONGO_URI n'est pas configuré, l'API fonctionne en mode démo (lecture seule).

## Déploiement

```bash
# Déployer sur Vercel
vercel --prod
```

Le site sera disponible à l'URL fournie par Vercel après le déploiement.
