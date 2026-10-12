# Project images

One folder per project, named with the project's slug (the same as its page in `public/portfolio/<slug>/`).

```
projects/
  ora-5-unveiling/            Cycle & Carriage, Singapore Motorshow, January 2026
  coinw-token2049-afterparty/ CoinW, TOKEN2049 afterparty, October 2025
  audemars-piguet-staff-party/ Audemars Piguet, SEA staff party, October 2025
  propw-token2049/            PropW, TOKEN2049, October 2025
  tsubaki-20th-anniversary/   TSUBAKI, 20th anniversary roadshow, July 2026
  tsubaki-brand-refresh/      TSUBAKI, brand refresh roadshow (placeholder images)
```

Inside each folder:

- `cover.webp`: the project's face (16:10), used on the Work grid, the home hero and cards.
- `second.webp`: a second view for the footer strip.
- `img-01.webp`, `img-02.webp` …: the project page, in order. Each is cropped from the original to the exact shape of its place in the page mosaic (cinematic 21:9, wide 16:10, tall 4:5, square details, 2:1 insets).

All images are WebP, up to 2000 px, under 400 KB.
Original full-size files are not kept in this repository.
