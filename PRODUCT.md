# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS, opened straight from disk. Each control-site version is its own HTML file; they share one `app/lumen-core.js` (mock device, light math). No build step.

## Users

Right now: people watching a demo or pitch on a laptop (classmates, judges, investors). Later: reef hobbyists controlling the light from a phone next to the tank.

## Product Purpose

Lumen Reef 60 is a smart LED light for 60 cm marine reef tanks. The control site proves the app concept before the hardware exists: you set brightness (PAR), the spectrum mix, and a 24-hour light schedule, or pick a preset.

## Capabilities and Constraints

- 7 LED channels: UV, Violet, Royal Blue, Blue, Green, White, Red (from the product render).
- 10–100% dimming per channel. PAR range shown as 0–500 µmol/m²/s.
- 24 h schedule: sunrise ramp, midday plateau, sunset ramp, moonlight.
- Hardware is not designed yet. All controls talk to a **mock device API** shaped like a future Wi-Fi controller's JSON endpoints. Every PAR number is a simulated estimate and must be labelled as such.

## Brand Commitments

- Product name: Lumen Reef 60 (renders in `render/`).
- All clean sans typography (user's choice for the control site).
- "Let the light set it": UI color comes from the light's current spectrum and time of day.
- Mood: precise instrument, premium product.

## Evidence on Hand

Product renders in `render/`. No real measurements, customers or prices exist: never invent them.
