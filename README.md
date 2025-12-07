# 🎮 Runkemannen

Eit retro stealth-spel bygd med React og TypeScript der du må smyge deg innpå jenter for å lade opp "runkemeteret" utan å bli oppdaga av den patrulerande augeboksen.

## 🎯 Spelemål

**Mål:** Samle flest mogleg poeng ved å fullfør nivå før tida renn ut.

### Spelmekanikkar

- **💙 Lad opp mana:** Smyg deg innpå jenter (blonde eller raude) for å lade opp "runkemeteret" (Mana). Må vere innan synslengd utan å bli oppdaga.
- **💥 RUNK-knappen:** Når meteret er fullt (100%), trykk RUNK-knappen nært ein jente for å sanke 500 poeng og fullføre målet.
- **👁️ Augeboksen:** Pass på den patrulerande augeboksen! Kontakt med auge fører til "distraksjon" og meteret vert tømd. Du mistar kontrollen i 3 sekund.
- **⏱️ Tidsbegrensning:** Kvart nivå har ei tidsbegrensning. Fullfør alle mål før tida renn ut!

## 🕹️ Kontroller

- **Piltastar / WASD:** Beveg spelaren
- **RUNK-knapp:** Utfør handling når meteret er fullt og du er nært ein jente

## 🚀 Køyre lokalt

**Krav:** Node.js (v18 eller nyare)

1. Installer avhengigheiter:
   ```bash
   npm install
   ```

2. Start utviklingsserver:
   ```bash
   npm run dev
   ```

3. Opne nettlesaren på `http://localhost:3000`

## 📦 Bygg for produksjon

```bash
npm run build
```

Bygde filer vert plassert i `dist/` mappa.

## 🌐 Deploy til Vercel

Dette prosjektet er konfigurert for enkel deployment til Vercel:

1. Installer Vercel CLI (valgfritt):
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

Eller koble repositoryet til Vercel via deira webgrensesnitt for automatisk deployment ved kvar push.

## 🎨 Teknologi

- **React 19** - UI-rammeverk
- **TypeScript** - Type-sikkerheit
- **Vite** - Rask build-tool og utviklingsserver
- **Tailwind CSS** - Styling
- **Canvas API** - Spelrendering

## 📝 Spellogikk

Spelet består av fleire nivå med aukande vanskegrad:
- Fleire jenter å "jakte" på
- Fleire augeboksar som patruljerer
- Meir komplekse hindringar
- Kortare tidsbegrensningar

Augeboksane patruljerer området og vil forfølgje deg dersom dei ser deg. Jentene vil røme vekk dersom dei oppdagar deg for nært. Taktikk og timing er avgjerande!

## 📄 Lisens

Dette prosjektet er laga for underhaldningsføremål.
