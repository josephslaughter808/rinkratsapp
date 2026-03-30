# Rink Rats

Rink Rats is a mobile-first adult hockey league app built with Next.js and wrapped for native delivery with Capacitor.

## Local Web App

Run the web app locally:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Native App Shell

This repo already includes a Capacitor iOS shell in [`ios/App`](./ios/App).

Current Capacitor identity:

- App name: `Rink Rats`
- App id: `com.josephslaughter.rinkratsapp`
- Default shell URL: [rinkratsapp-josephslaughter808s-projects.vercel.app](https://rinkratsapp-josephslaughter808s-projects.vercel.app)

Useful commands:

```bash
npm run cap:sync:ios
npm run cap:copy:ios
npm run cap:open:ios
```

To point the iOS shell at a custom URL during development:

```bash
CAP_SERVER_URL=http://YOUR_LOCAL_IP:3000 npm run cap:sync:ios
```

Then open the Xcode project:

```bash
npm run cap:open:ios
```

## What Is Already Done

- Mobile-first app UI in the Next.js App Router
- Sticky top switcher and bottom app navigation
- Capacitor iOS shell committed in the repo
- App metadata and viewport configuration for a native-style install
- Production deploys hosted on Vercel for the native shell to load

## What Still Needs Native/App Store Work

- Real app icons and splash artwork
- Apple signing, provisioning, and App Store Connect setup
- Android package setup when you want Google Play delivery
- Native plugins for features like push notifications, camera, and richer uploads

## Tech Stack

- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev/)
- [Capacitor](https://capacitorjs.com/docs)
- [Supabase](https://supabase.com/docs)
