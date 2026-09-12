# Future Camera Lab

En lokal, immersiv Three.js-prototyp för att lära sig fotografering genom en 3D-kamera.

## Modell

Placera en GLB-modell här:

```text
assets/models/camera.glb
```

Om filen saknas visar sidan en tydlig placeholder och fortsätter fungera.

## Starta lokalt

```bash
python3 -m http.server 8000
```

Öppna sedan:

```text
http://localhost:8000
```

## Senaste justeringar

- Canon-modellen laddas via `assets/models/camera.glb`.
- Scenljuset är kalibrerat för bättre läsbarhet av kamerahus, EVF, topp och grepp utan att lämna den mörka studiokänslan.
- Den bakre LCD-skärmen får en dynamisk canvas-textur med live-view-känsla: `M`, `f/2.8`, `1/250`, `ISO 100` och fokusramar.
- UI-panelerna är nedtonade så kameran förblir huvudobjektet.

## Struktur

```text
future-camera-lab/
├── index.html
├── style.css
├── app.js
├── README.md
└── assets/
    ├── models/
    │   └── camera.glb
    ├── textures/
    └── images/
```
