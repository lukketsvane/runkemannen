# 🎮 Runkemannen

Eit retro stealth-spel bygd med React og TypeScript der du må smyge deg innpå jenter for å lade opp "runkemeteret" utan å bli oppdaga av den patrulerande augeboksen.

## 🎯 Spelemål

**Mål:** Overlev så lenge som mogleg ved å halde ladinga oppe!

### Spelmekanikkar

- **💙 Lad opp mana:** Smyg deg innpå nakne jenter (blonde eller raude) på stranda for å lade opp "runkemeteret" (Mana). Må vere innan synslengd utan å bli oppdaga.
- **⚡ Hades-stil:** Ladinga din vert gradvis tømd over tid. **Game over når ladinga når null!**
- **💥 RUNK-knappen:** Når meteret er fullt (100%), trykk RUNK-knappen nært ein jente for å sanke 500 poeng og fullføre målet.
- **👁️ Augeboksen:** Pass på den patrulerande augeboksen! Kontakt med auge fører til "distraksjon" og meteret vert tømd. Du mistar kontrollen i 3 sekund.
- **🕶️ Solbriller:** Saml solbriller for ekstra stealth-evner!
- **🏖️ Strandmiljø:** Nakne jenter på stranda – nokre badar, andre skifter, nokre gøymer seg bak tre.

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

Spelet består av fleire djup (d1-d25) med aukande vanskegrad:
- Fleire jenter å "jakte" på
- Færre augeboksar (redusert fokus på fiender)
- Meir komplekse hindringar
- Raskare mana-tap

Augeboksane patruljerer området og vil forfølgje deg dersom dei ser deg. Jentene vil røme vekk dersom dei oppdagar deg for nært. Taktikk og timing er avgjerande! Spelet er inspirert av Hades sitt djup-system.

## 📄 Lisens

Dette prosjektet er laga for underhaldningsføremål.
