# Bunka Web Client
NextJS application, with D3js visualisations.
## Dev
From monorepo root.
```bash
yarn web dev    # Starts local development server (with .env.local configuration).
yarn beta       # Generates static website using .env.beta configuration.
yarn static     # Generates static website using .env.local configuration.
```

## Environment
```bash
#### Only accessible from NodeJS context.
### set to local if you need the dummySearch data to be displayed
API_ENDPOINT=https://api.bunkasearch.com

# TRUE necessary for generating static websites.
NO_TRANSLATE=false


### Accessible from NextJS app.

NEXT_PUBLIC_API_ENDPOINT=$API_ENDPOINT

# Tracking & Analytics.
NEXT_PUBLIC_PIWIK_CONTAINER_ID=
NEXT_PUBLIC_PIWIK_CONTAINER_URL=https://bunka.containers.piwik.pro
NEXT_PUBLIC_MATOMO_URL=https://bunka.matomo.cloud/
NEXT_PUBLIC_MATOMO_ID=
NEXT_PUBLIC_HOTJAR_SNIPPET_VERSION=6
NEXT_PUBLIC_HOTJAR_ID=

# Override search configuration. Does not override "godmode".
NEXT_PUBLIC_DIMENSION_SCORE_THRESHOLD=0.8
NEXT_PUBLIC_DIMENSION_CHIPS_THRESHOLD=0.8
NEXT_PUBLIC_POPULARITY_SCORE_THRESHOLD=0.9
NEXT_PUBLIC_POPULARITY_CHIP_THRESHOLD=0.8

# Make godmode accessible by typing "godmode" on the front page.
NEXT_PUBLIC_GOD_MODE=false

# Generates app WITHOUT features in development. TRUE necessary in .env.beta.
NEXT_PUBLIC_BETA=false
```