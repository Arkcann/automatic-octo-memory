# Chelsea Valentine Pattern App

An interactive Valentine-themed web app that uses a swarm of animated particles to continuously form the name **Chelsea**.

- **Default mode:** glowing heart particles
- **Pony mode toggle:** switches particles to pony-themed emoji while keeping the Valentine ripple aesthetic
- **Interactive ripples:** mouse/touch movement and pulse button perturb the scene
- **Mobile-ready:** responsive canvas sizing, orientation hint for portrait phones, and a full-screen toggle for immersive viewing

## Run locally

Because this app uses static files only, serve it from this folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## GitHub Pages hosting

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that deploys the site as a static GitHub Pages app.

### One-time repository setup

1. Push this repository to GitHub.
2. In GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Source: GitHub Actions**.
4. Ensure your default branch is `main` (or update the workflow trigger branch).
5. Push to `main` to trigger deployment.

After the workflow finishes, your site will be available at:

`https://<your-github-username>.github.io/<repository-name>/`

## Notes

- No build step is required.
- The app is intentionally canvas-based for smooth particle + ripple animation.
