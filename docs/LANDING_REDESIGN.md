# Mercato landing redesign

Direction: Ahead of the curve. Black, electric cobalt, and acid lime; an original sculptural demand ribbon, editorial typography, and an interactive illustrative demand studio.

## Asset

Generated with the built-in image-generation tool. Original: `frontend/public/images/demand-sculpture.png`. Web-optimized version: `frontend/public/images/demand-sculpture.webp` (193,044 bytes). No third-party reference image was used as an image-edit input.

Generation prompt:

Create a premium abstract 3D product-art asset for a luxury technology website, square 1536x1536 composition. Pure near-black #030407 background seamlessly fading to exact black at ALL edges. One monumental flowing sculptural ribbon made of electric cobalt blue translucent finely ribbed glass / satin metal, curled in a dynamic asymmetric flowing S loop, broad elegant folded surfaces, macro fine ribbed texture like pleated blue flower petals, tactile photographic realism, exquisite directional studio lighting, deep blue shadows and brilliant icy blue edge highlights. A SINGLE very slender acid lime #D4FF24 luminous filament traces a smooth ascending trajectory weaving around the ribbon, subtle not neon environment. Object floats centered, occupies 80% of image, dramatic diagonal composition from lower-left to upper-right, dark center opening and pronounced three-dimensional depth, restrained bloom. Think high-end industrial design campaign photographed with macro lens, sophisticated physical materials, cinematic black negative space. NO TEXT, no letters, no logos, no UI, no charts, no people, no earbuds, no rectangular frames. This is a finished standalone website hero artwork, not a website screenshot.

## Implementation

Landing styles use a `mc-` namespace, imported through globals.css to work with this repository's Tailwind Turbopack loader. The existing workspace pages and purchase-order provider remain in place. The demo is explicitly illustrative, does not claim to use live API data, and never modifies stock or purchase orders.

## Validation

TypeScript and targeted ESLint passed. All 9 existing frontend tests passed. Production build passed. Browser checks verified scenario changes, no page errors, and no horizontal overflow at 390px. Desktop and mobile screenshots are in docs/images/redesign-desktop.png and redesign-mobile.png.
