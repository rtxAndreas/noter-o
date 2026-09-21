This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# noter-o

## Tauri v2 et builds Docker

Le projet contient un shell Tauri v2 autour de l’export statique Next.js (`out`).
Les bundles desktop sont construits dans `Dockerfile.tauri`, puis servis sur le
port `3000` pour pouvoir être téléchargés depuis le conteneur.

Construire et démarrer le conteneur desktop :

```bash
docker compose build tauri-desktop
docker compose up tauri-desktop
```

Les fichiers générés sont disponibles dans `artifacts/desktop/` et via
<http://localhost:3000>.

L’environnement Android est fourni par `Dockerfile.android`. Il monte le projet
local, initialise Android Tauri si nécessaire, lance `tauri android build --apk`
et copie les APK dans `artifacts/android/` :

```bash
docker compose --profile android build tauri-android
TAURI_ANDROID_TARGET=aarch64 docker compose --profile android run --rm tauri-android
```

Pour produire une autre architecture, remplacer `aarch64` par `armv7`, `i686`
ou `x86_64`.

## APK Android via GitHub Actions

Le workflow [android-apk.yml](.github/workflows/android-apk.yml) compile
l’application Tauri Android et publie l’APK comme artefact GitHub. Il peut être
lancé manuellement depuis l’onglet **Actions** ou automatiquement sur `main`.

Pour publier un APK dans une GitHub Release de test, créer un tag de version :

```bash
git tag v0.1.0
git push origin v0.1.0
```

Le workflow signe l’APK avec les secrets GitHub `KEYSTORE_BASE64`,
`RELEASE_KEYSTORE_PASSWORD`, `RELEASE_KEY_ALIAS` et `RELEASE_KEY_PASSWORD`.
L’APK signé peut ensuite être installé manuellement sur un appareil Android.
