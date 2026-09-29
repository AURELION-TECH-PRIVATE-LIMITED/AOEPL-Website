Art of Engineering website (Vite build)

Setup
  npm install        Install once
  npm run dev        Local dev server with live reload
  npm run build      Build the site into dist/
  npm run preview    Serve the dist/ build locally, to check it before deploying

Pages
  index.html         Home: the 3D hero
  services.html      What we take on (scroll-cycled services)
  how-we-work.html   How every site is run
  estimate.html      Cost estimator
  contact.html       Tell us about your plot

Shared files
  assets/site.css    All styles (colours are the variables at the top)
  assets/site.js     Menu, tabs, estimator, forms. Phone and email: edit the CONTACT line at the top.
                     Estimator packages, rates, specs and BOQ split: edit the PKG and BOQ lines.
  assets/hero.js     The 3D hero (only loaded by index.html). Needs internet for Three.js from cdnjs.

Deploy
  Run npm run build, then host the dist/ folder on Netlify, Vercel or GitHub Pages.
  (Netlify/Vercel: build command "npm run build", publish directory "dist".)
