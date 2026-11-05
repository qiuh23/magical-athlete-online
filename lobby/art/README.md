# Lobby artwork

Both covers use the same 640 × 360 canvas, a raised tabletop composition and soft material shadows. All artwork is served locally; no remote images, fonts or runtime libraries are required.

## Athlete

`athlete.svg` is an original vector redraw of this project's mint stadium board and existing hare, leaptoad and rocket-scientist character designs, informed by `src/client/scene/DioramaStadium.tsx` and `scripts/generate-3d-assets.mjs`. It does not copy third-party character assets. The foreground die is an inline SVG layer in `lobby/index.html`, so CSS can move just the die on hover, focus or touch. Its ground shadow stays still, and reduced-motion disables the movement.

## Wizard

`wizard.svg` embeds three existing, project-authored card illustrations from [`qiuh23/wizard-friends`, `src/assets/cards/`](https://github.com/qiuh23/wizard-friends/tree/db33eeb42118c57e3ad0cf6f4c7c3a3edb801987/src/assets/cards). The original paths, colours and card layouts are retained; SVG IDs and their references are prefixed to prevent collisions. The cover's felt table, paper edges, card back and prediction chips are original lobby artwork. The chips illustrate predicted trick counts, not betting.

Source SHA-256 values:

| Source card | ID prefix | SHA-256 |
| --- | --- | --- |
| `green-13.svg` | `forest-` | `c92e47cdd7aeb3039318460b985cd2065888f0a9ca6a852d7bfa50e2237b0de9` |
| `wizard.svg` | `mage-` | `82842a83d0d38b6635e1a05d09bf8eaf652dc2c696a09824d1e4afdf2518d80e` |
| `yellow-13.svg` | `astral-` | `20e65cbb0f2b95b1d020b4dc0dc692cba4e043c200cadd6d10a2115d216f0568` |

These remain project assets; they are not represented as Kenney or CC0 artwork. No third-party illustration has been added. Keeping the two existing asset filenames preserves the domestic Nginx public-file allowlist.
