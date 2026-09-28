# Courtside — Fantasy Auction & Budget Draft Manager

Local, single-device fantasy auction app for παρέες. Ο Host τρέχει την
εφαρμογή στο κινητό του, ορίζει budget, και καταγράφει χειροκίνητα τις
μεταγραφές καθώς εξελίσσεται η δημοπρασία.

## 📲 Εγκατάσταση σε Android (APK)

Μπορείτε να κατεβάσετε και να εγκαταστήσετε την εφαρμογή απευθείας στο Android κινητό σας!
* Πηγαίνετε στη σελίδα **[Releases](../../releases)** του repository.
* Επιλέξτε την τελευταία έκδοση και κατεβάστε το αρχείο **`.apk`** από την ενότητα **Assets**.

## Δεύτερος Τρόπος (Expo / χωρίς Xcode ή Android Studio)

1. Εγκατάστησε το [Expo Go](https://expo.dev/go) στο κινητό σου (App Store / Play Store).
2. Στον υπολογιστή:
   ```bash
   npm install
   npx expo start
   ```
3. Σκάναρε το QR code με την κάμερα (iOS) ή μέσα από το Expo Go (Android).

Θέλει Node.js 18+. Δεν χρειάζεται λογαριασμός Expo για τοπική εκτέλεση.

## Δομή αρχείων

```
fantasy-auction-app/
├── App.js                       # navigation root, wraps GameProvider
├── app.json                     # expo config (dark theme, bundle ids)
├── package.json
├── src/
│   ├── context/
│   │   └── GameContext.js        # state (reducer) + AsyncStorage persistence
│   ├── data/
│   │   ├── positions.js          # roster σύνθεση ανά άθλημα (configurable)
│   │   ├── players.sample.json   # δείγμα βάσης παικτών/προπονητών ανά σεζόν
│   │   └── SCHEMA.md             # τεκμηρίωση JSON schema
│   ├── screens/
│   │   ├── SetupScreen.js        # Screen 1: budget, άθλημα, σεζόν, μάνατζερ
│   │   └── DraftScreen.js        # Screen 2: live draft, side-by-side dashboard
│   ├── components/
│   │   ├── TransferBar.js        # πάνελ αγοράς πάνω μέρος
│   │   ├── ManagerColumn.js       # μία στήλη μάνατζερ (side-by-side)
│   │   └── RosterSlot.js         # ένα κελί θέσης (πράσινο/γκρι)
│   ├── theme/
│   │   └── theme.js              # dark mode / αθλητική αισθητική
│   └── utils/
│       └── validation.js         # έλεγχος υπολοίπου & διαθεσιμότητας θέσης
```

## Λογική που υλοποιείται

- **Custom budget** ανά μάνατζερ, ορίζεται στο Setup.
- **Χειροκίνητη τιμολόγηση**: ο Host πληκτρολογεί την τιμή κατακύρωσης· δεν
  υπάρχουν προκαθορισμένες τιμές παικτών στη βάση.
- **Autocomplete search** παικτών/προπονητών με φίλτρο άθλημα+σεζόν, εξαιρεί
  όσους έχουν ήδη αγοραστεί.
- **Custom Add**: αν δεν βρεθεί το όνομα, ο Host το προσθέτει χειροκίνητα με
  θέση· ζει μόνο μέσα στο τρέχον παιχνίδι (`customPeople` στο state).
- **Validation** (`src/utils/validation.js`):
  - Απαγόρευση αγοράς αν `price > balance`.
  - Επιτρέπεται μόνο 1 παίκτης ανά θέση/slot (π.χ. 1 PG, ή στο ποδόσφαιρο
    μέχρι 4 DEF — configurable στο `positions.js`), 1 προπονητής.
  - Απαγόρευση διπλής αγοράς του ίδιου ατόμου (από ίδιο ή άλλο μάνατζερ).
- **Undo/Delete**: κάθε γεμάτο slot έχει κουμπί "Undo" που επιστρέφει το
  ποσό στο υπόλοιπο του μάνατζερ.
- **Side-by-side dashboard**: οριζόντιο scroll από στήλες μάνατζερ, καθεμία
  με υπόλοιπο σε πραγματικό χρόνο, ειδικό πλαίσιο προπονητή, και οπτική
  λίστα θέσεων (✓ πράσινο για καλυμμένες, γκρι για κενές).
- **Persistence**: όλο το state (μάνατζερ, μεταγραφές, custom άτομα)
  αποθηκεύεται αυτόματα τοπικά μέσω `AsyncStorage` — κλείνεις την εφαρμογή
  και συνεχίζεις από εκεί που έμεινες.

## Επέκταση της βάσης δεδομένων

Το `players.sample.json` καλύπτει πλέον **261 παίκτες/προπονητές** στη σεζόν
2026-27, σε τρεις διοργανώσεις:
- **EuroLeague**: και οι 20 ομάδες, ~7-10 παίχτες + coach η καθεμία, βάσει
  πραγματικών μεταγραφών καλοκαιριού 2026.
- **Greek Basket League**: Olympiacos/Panathinaikos (ίδιοι παίχτες με
  EuroLeague) + AEK, Maroussi, PAOK, Promitheas, και πλήρες ρόστερ Peristeri
  (14 παίχτες + coach).
- **Super League Greece**: και οι 14 ομάδες της σεζόν 2026-27 έχουν
  τουλάχιστον coach + βασικό παίχτη· AEK Athens, Olympiacos FC και
  Panathinaikos FC έχουν σχεδόν πλήρες ρόστερ (25, 25 και 16 παίχτες
  αντίστοιχα, ενημερωμένο Σεπτέμβριο 2026), PAOK έχει βασικό πυρήνα.

Η αγορά μεταγραφών είναι ρευστή — κάποια ονόματα μπορεί ήδη να έχουν
αλλάξει ομάδα. Αντικατέστησε ή συμπλήρωσε το αρχείο όποτε θες, κρατώντας
ακριβώς το σχήμα του `src/data/SCHEMA.md`.

## Πράγματα που θα προστεθούν μελλοντικά...

- Export του τελικού draft (screenshot/PDF/share) στο τέλος.
- "Undo last transfer" γενικό κουμπί (πέρα από το ανά-slot undo).
- Real-time δεύτερη οθόνη (π.χ. tablet σε προβολή) — θα χρειαστεί δίκτυο
  αντί για local-only state.
