# Project images

One folder per project, named with the project's slug (the same as its page in `public/portfolio/<slug>/`). Newest first:

```
projects/
  cetaphil-feel-it-in-30/         Cetaphil, Feel It in 30 roadshow, August 2026
  tsubaki-20th-anniversary/       TSUBAKI, 20th anniversary with Suzy Bae, July 2026
  ora-5-unveiling/                Cycle & Carriage, ORA 5 at the Singapore Motorshow, January 2026
  propw-token2049/                PropW, TOKEN2049 booth, October 2025
  coinw-token2049-afterparty/     CoinW, TOKEN2049 afterparty, October 2025
  audemars-piguet-staff-party/    Audemars Piguet, 150 Years staff party, October 2025
  tsubaki-brand-refresh/          TSUBAKI, brand relaunch roadshow, April 2025
  don-julio-ultima-glorifier/     Don Julio, Ultima bottle glorifier, July 2024
  1664-brut-private-trade-event/  1664, Brut private trade event at Kinki, June 2024
```

Inside each folder:

- `cover.webp`: the project's face (16:10), used on the Work grid, the home hero and the home cards.
- `second.webp`: a second view for the footer strip.
- `img-01.webp`, `img-02.webp` …: the project page, in order. Renders first, then photos. Each keeps the original's proportions (no cropping); collage posts are split into their panels.

All images are WebP, up to 2000 px, under 400 KB.
Original full-size files are not kept in this repository.
