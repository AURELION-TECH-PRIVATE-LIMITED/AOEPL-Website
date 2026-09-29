# Art of Engineering website

Static multi-page site. No build step. Pages: index.html, services.html,
how-we-work.html, estimate.html, contact.html. Shared: assets/site.css,
assets/site.js, assets/hero.js.

## Hard rules
- NEVER edit assets/hero.js or the hero section markup in index.html.
  The 3D hero is approved and must stay exactly as is.
- Do not change pages I did not mention in the request.
- Keep the design system: colours are the CSS variables at the top of
  site.css (night #1C1511, brass #D2A85A, stone #E1DFD9). Fonts: Big Shoulders
  Display (headings), Newsreader (body). No new fonts or colours without asking.
- Do not invent facts, stats, testimonials or certifications.

## Where things live
- Phone/email: CONTACT line at top of assets/site.js
- Estimator packages, rates, specs, BOQ split: PKG and BOQ near top of site.js
- Services page zoom: .pz-80 (services) and .pz-75 (estimator) in site.css

## Testing
- Serve locally (Live Server or `npx serve`) and check every page at 1440px
  and 390px wide. Check the browser console for errors.
- Three.js loads from cdnjs, so the hero needs internet.