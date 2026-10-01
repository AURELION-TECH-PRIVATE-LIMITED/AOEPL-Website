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

Contact form email (Resend)
  The contact page's "Send by email" button posts to a Netlify Function
  (netlify/functions/send-enquiry.js), which emails the enquiry via Resend
  instead of opening the visitor's own mail app. If that call fails for any
  reason (not deployed yet, Resend misconfigured, offline), it falls back
  to the old mailto: behaviour, so the form always works.

  To make it actually send mail:
    1. Sign up at resend.com, verify artofengineering.in as a sending
       domain (just DNS records, separate from site hosting), and create
       an API key.
    2. Deploy this project on Netlify (netlify.toml is already set up:
       build "npm run build", publish "dist", functions
       "netlify/functions").
    3. In the Netlify site's dashboard, add an environment variable
       RESEND_API_KEY with that key. Never commit it or put it in this
       repo. Optionally add RESEND_FROM once the domain is verified, e.g.
       "Art of Engineering <enquiries@artofengineering.in>".
    4. To test locally before deploying: install the Netlify CLI, copy
       .env.example to .env and fill in your key, then run `netlify dev`
       instead of `npm run dev` (it proxies the static site and runs the
       function together).
