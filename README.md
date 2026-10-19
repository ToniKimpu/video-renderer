# video-renderer

Renders videos for my Facebook pages with GitHub Actions. The video projects themselves live in private
repositories; the workflow checks them out with a read-only token at run time, so nothing from them is stored here.

Run it from the Actions tab ("Render videos" → "Run workflow"), or:

    gh workflow run render.yml -R ToniKimpu/video-renderer -f days="things-worth-knowing/day-06" -f parts="video"

Rendered files are attached to the run (Artifacts) for one day.
