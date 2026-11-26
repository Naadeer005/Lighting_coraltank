# Lighting_coraltank

Product design renders for a smart LED light for marine (coral reef) aquariums.

Key features:

- LED lights
- 60 cm tank
- Changing PAR
- Changing spectrum
- Changing time of day
- App control

## Control app (seven styles)

A working concept of the light's control app, built before the hardware exists. Every version talks to the same **mock device API** in [`app/lumen-core.js`](app/lumen-core.js), shaped like the light's future Wi-Fi JSON endpoints. PAR values are simulated estimates.

Each version has: master brightness and PAR readout, 7 channel sliders (UV, Violet, Royal Blue, Blue, Green, White, Red), presets (Coral Pop, Daylight, Deep Reef, Photo, Acclimation), a 24 h schedule with sunrise/sunset ramps and moonlight, a time-of-day preview, and an offline simulation.

Run it locally, then open http://127.0.0.1:5173/ to compare all seven:

```
python -m http.server 5173 --directory app
```

Add `?t=12` to any version's URL to preview that hour. Each version below is shown at desktop width (1440 px) and phone width (390 px).

### 1 · Ambient
The whole screen is lit by the light; drag the day ribbon to preview any hour.
<img src="render/app/v1-ambient.png" alt="Ambient, desktop" width="70%"> <img src="render/app/mobile/v1-ambient.png" alt="Ambient, phone" width="22%">

### 2 · Aluminium
Machined product feel; turn the ring around the lens to set master brightness.
<img src="render/app/v2-aluminium.png" alt="Aluminium, desktop" width="70%"> <img src="render/app/mobile/v2-aluminium.png" alt="Aluminium, phone" width="22%">

### 3 · Swiss
Strict grid, huge numerals, a solid block of the current light color.
<img src="render/app/v3-swiss.png" alt="Swiss, desktop" width="70%"> <img src="render/app/mobile/v3-swiss.png" alt="Swiss, phone" width="22%">

### 4 · Console
Lighting desk with a fader and live LED meter per channel.
<img src="render/app/v4-console.png" alt="Console, desktop" width="70%"> <img src="render/app/mobile/v4-console.png" alt="Console, phone" width="22%">

### 5 · Almanac
A 24 h sun clock on sea-chart paper; drag the sun around the dial.
<img src="render/app/v5-almanac.png" alt="Almanac, desktop" width="70%"> <img src="render/app/mobile/v5-almanac.png" alt="Almanac, phone" width="22%">

### 6 · Spectrometer
The emission spectrum is the hero, with each fader under its own wavelength.
<img src="render/app/v6-spectrometer.png" alt="Spectrometer, desktop" width="70%"> <img src="render/app/mobile/v6-spectrometer.png" alt="Spectrometer, phone" width="22%">

### 7 · Ambient + Spectrum
Version 1's lit screen with version 6's live spectrum beside the PAR number; each channel slider stands under its own wavelength.
<img src="render/app/v7-ambient-spectrum.png" alt="Ambient + Spectrum, desktop" width="70%"> <img src="render/app/mobile/v7-ambient-spectrum.png" alt="Ambient + Spectrum, phone" width="22%">
