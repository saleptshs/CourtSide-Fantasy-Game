# JSON Schema — Players & Coaches Database

Το αρχείο `players.json` είναι ένα object χωρισμένο ανά άθλημα, και μέσα σε κάθε
άθλημα χωρισμένο ανά σεζόν. Κάθε σεζόν περιέχει μία λίστα από "άτομα"
(παίκτες ή προπονητές), το καθένα με ενιαίο σχήμα:

```jsonc
{
  "basketball": {
    "2026-2027": [
      {
        "id": "bball-2026-0001",       // μοναδικό, σταθερό id
        "name": "Kendrick Nunn",
        "role": "player",               // "player" | "coach"
        "position": "SG",               // βλ. πίνακα θέσεων παρακάτω· null αν role=coach
        "team": "Panathinaikos AKTOR",
        "league": "EuroLeague",         // "EuroLeague" | "Greek Basket League"
        "nationality": "USA",
        "photoUrl": null                // προαιρετικό
      }
    ]
  },
  "football": {
    "2026-2027": [
      {
        "id": "foot-2026-0001",
        "name": "Fran Navarro",
        "role": "player",
        "position": "FWD",             // "GK" | "DEF" | "MID" | "FWD"
        "team": "Panathinaikos FC",
        "league": "Super League Greece",
        "nationality": "Spain",
        "photoUrl": null
      }
    ]
  }
}
```

## Θέσεις ανά άθλημα (roster slots)

Ορίζονται ξεχωριστά στο `src/data/positions.js`, ώστε η δομή σύνθεσης
(πόσες θέσεις ανά ρόλο) να είναι configurable χωρίς να αγγίζεις τα δεδομένα
παικτών.

- **Μπάσκετ** (5+1): PG ×1, SG ×1, SF ×1, PF ×1, C ×1, HC (Head Coach) ×1
- **Ποδόσφαιρο** (11+1): GK ×1, DEF ×4, MID ×4, FWD ×2, HC (Head Coach) ×1
  (η κατανομή DEF/MID/FWD είναι απλώς το default schema, μπορεί να αλλάξει
  στο `positions.js`)

## Custom Add στη ροή του παιχνιδιού

Όταν ο Host προσθέτει άτομο που δεν υπάρχει στη βάση, δημιουργείται ένα
"local" record με το ίδιο σχήμα (`id` παράγεται με prefix `custom-`), που
ζει μόνο μέσα στο state του τρέχοντος draft (δεν γράφεται πίσω στο
`players.json`).

## Πηγή δεδομένων

Το `players.sample.json` περιέχει ένα μικρό, ενδεικτικό δείγμα (όχι πλήρη
rosters) για EuroLeague / Greek Basket League / Super League Greece, σεζόν
2025-2026 και 2026-2027, ώστε η εφαρμογή να τρέχει "out of the box". Μπορείς
να αντικαταστήσεις το αρχείο με πλήρη δεδομένα διατηρώντας το ίδιο σχήμα.
