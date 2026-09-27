# NEXT development typography audition

These unmodified static fonts are used only by `/dev/typography`. No production
font choice is implied. Runtime loading uses the existing transitive expo-font
57.0.4 dependency; no dependency files were changed.

## Official sources

- ArchivoBlack-Regular.ttf: https://raw.githubusercontent.com/Omnibus-Type/ArchivoBlack/master/fonts/ttf/ArchivoBlack-Regular.ttf
- SpaceGrotesk-Bold.otf: https://raw.githubusercontent.com/floriankarsten/space-grotesk/master/fonts/otf/SpaceGrotesk-Bold.otf
- ClashDisplay-Bold.otf: `ClashDisplay_Complete/Fonts/OTF/ClashDisplay-Bold.otf` from https://api.fontshare.com/v2/fonts/download/clash-display
- Inter-Regular.otf and Inter-Medium.otf: `extras/otf/` from https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip

Licenses are included verbatim under `licenses/`: SIL OFL 1.1 for Archivo Black,
Space Grotesk and Inter; ITF Free Font License v2.0 (17 Aug 2026) for Clash Display.
Clash Display is proprietary freeware, not OFL. The font files were not modified,
subsetted or converted. Wordmark spacing and the separate circular point are
application layout studies, not modified font software.

## Open on a physical iPhone

Run `npm start -- --go` and use the Metro server address shown in the terminal.
For an address `exp://HOST:PORT`, open
`exp://HOST:PORT/--/dev/typography` on the iPhone using Safari or an Expo Go deep link.
The phone and computer must be on the same accessible network.

Compare A/B/C in Wordmark, Statements, Interface and Tokens. Switching direction
preserves the section and scroll position. Each period treatment has large/small
and white-on-black/black-on-white specimens. Wordmarks are fixed-size graphic
studies; other text respects device font scaling. Exit returns to normal launch.
The route redirects to `/` in production and the font module is in a development
conditional require. Delete the route, feature folder and this asset folder to
remove the audition; no production screen was edited.

## Measured files

| File | Bytes | SHA-256 |
|---|---:|---|
| ArchivoBlack-Regular.ttf | 107140 | 3cdaf0609a90ce679499407fc7761f3adb5ae8d3c3237249c2d11f5f095eda7d |
| ClashDisplay-Bold.otf | 25276 | cbf5670a6d502f6942e74066f945fb2541f0a3ff930145fdf053a76290ac88b6 |
| Inter-Medium.otf | 627988 | 6c222ed2c3660524dd0c14fb745e00fee65c5361ab28f60fba6730bf4e648763 |
| Inter-Regular.otf | 609600 | d4f2b9e148059a15f014cb0f0b8fea8cd11bfa447dd483bedf1b0adc0e2ba799 |
| SpaceGrotesk-Bold.otf | 72748 | be8709abe941dcc98f3625663b340ca20dc90cd6806ee76bd68b568097b6368f |
