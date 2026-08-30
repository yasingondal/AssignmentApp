# Docs

## Amrutam Super App — Technical Documentation

| Artifact | Description |
|----------|-------------|
| [Amrutam_Super_App_Technical_Documentation.pdf](./Amrutam_Super_App_Technical_Documentation.pdf) | **Primary deliverable** — senior engineering system guide with Mermaid flowcharts |
| [Amrutam_Super_App_Technical_Documentation.html](./Amrutam_Super_App_Technical_Documentation.html) | Source HTML used to render the PDF |
| `generate-pdf.mjs` | Regenerates the PDF via Puppeteer |

### Regenerate PDF

```bash
cd docs
npm install puppeteer
node generate-pdf.mjs
```

The PDF covers architecture, bootstrap, auth, consultation booking (incl. offline sync), shop, health timeline, offline-first, performance (5k/20k/10k), mock API, design system, and testing — with flowcharts for each major flow.
