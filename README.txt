# Future Camera Lab

Det här är ett lokalt Three.js-projekt för vår 3D-kameraprototyp.

## 1. Lägg in 3D-modellen
Placera din GLB-fil här:

assets/models/camera.glb

Filnamnet måste vara exakt:

camera.glb

## 2. Starta en lokal webbserver

Projektet ska inte öppnas genom att dubbelklicka på index.html,
eftersom webbläsaren ofta blockerar laddning av lokala GLB-filer.

### Enkelt med Python
Öppna Terminal / Kommandotolken i projektmappen och kör:

python -m http.server 8000

Öppna sedan:

http://localhost:8000

### Eller med VS Code
Installera extensionen "Live Server" och välj "Open with Live Server".

## Struktur

future-camera-lab/
├── index.html
├── style.css
├── app.js
├── README.txt
└── assets/
    ├── models/
    │   └── camera.glb
    └── textures/

## Nästa steg
- Klickbara delar på kameran
- Aperture dial
- f/1.2 → f/22
- Live depth-of-field preview
- Viewfinder mode
- Byta kameramodeller
