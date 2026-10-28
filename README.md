# 2026 California DMV Knowledge Test Simulator

An interactive web application that generates realistic **46-question California DMV knowledge practice tests** randomly drawn from a **105-question test bank** based strictly on the official **2026 California Driver's Handbook**.

---

## Features

- **Official 46-Question Format**: Every test randomly picks **46 multiple-choice questions** from the 105-question handbook bank using a Fisher-Yates shuffle.
- **83% Passing Threshold (38 / 46)**: Matches the official California DMV requirement of answering at least **38 out of 46 questions** correctly (maximum 8 errors allowed) to pass.
- **Question-by-Question Instant Learning**:
  - Immediately highlights whether your choice is **Correct** (green) or **Incorrect** (red) and displays the official handbook rule explanation.
  - Updates the right-hand **Question Palette** with live green (`Correct`) and red (`Incorrect`) question markers and a live score tally in the progress header.
- **Performance Breakdown by Handbook Section**:
  - The Results page calculates your exact accuracy (`Correct / Total` and percentage) for every section of the 2026 California Driver's Handbook tested in your exam.
  - Includes visual progress bars, status badges (`Passing (83%+)`, `Borderline`, `Needs Study`), sorting by handbook order or weakest sections first, and automatic study recommendations.
- **Filterable Question Review**: Filter your completed 46 questions by status (`All`, `Incorrect & Unanswered Only`, `Correct Only`) or by a specific **Handbook Section** to review your answer alongside the correct handbook answer and rule explanation.
- **Zero Dependencies / Works Offline**: Pure HTML5, CSS3, and vanilla JavaScript. Open `index.html` directly in any modern browser with no build step or server required.

---

## 14 Handbook Sections Covered (`105 Questions Total`)

| Section | Title | Questions in Bank |
| :--- | :--- | :---: |
| **Section 1** | The California Driver's License | 3 |
| **Section 2** | Getting an Instruction Permit and Driver's License | 5 |
| **Section 3** | The Testing Process | 5 |
| **Section 4** | Changing, Replacing, and Renewing Your Driver's License | 3 |
| **Section 5** | An Introduction to Driving | 8 |
| **Section 6** | Navigating the Roads | 24 |
| **Section 7** | Laws and Rules of the Road | 24 |
| **Section 8** | Safe Driving | 16 |
| **Section 9** | Alcohol and Drugs | 5 |
| **Section 10** | Financial Responsibility, Insurance Requirements, and Collisions | 4 |
| **Section 11** | Vehicle Registration Requirements | 2 |
| **Section 12** | Driver Safety | 2 |
| **Section 13** | Seniors and Driving | 2 |
| **Section 14** | Glossary | 2 |

---

## Project Structure

```text
├── index.html                        # Main application UI (Start, Quiz, Results & Section Analytics)
├── styles.css                        # Responsive CA DMV-themed stylesheet
├── app.js                            # Quiz engine, instant grading, section analytics & filters
├── questions.js                      # Browser-ready bundle of the 105-question bank
├── California_DMV_Handbook_2026.pdf  # Source 2026 California Driver's Handbook
└── data/
    ├── questions.json                # Merged 105-question JSON bank
    ├── merge_questions.py            # Script to validate and merge question batches into questions.json & questions.js
    ├── handbook_part1.txt            # Extracted text for Sections 1–5
    ├── handbook_part2.txt            # Extracted text for Section 6
    ├── handbook_part3.txt            # Extracted text for Section 7
    ├── handbook_part4.txt            # Extracted text for Sections 8–14
    └── q_part*.json                  # Modular section question batch files
```

---

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/vaultdweller101/ca_driver_test.git
   cd ca_driver_test
   ```
2. Open `index.html` directly in your browser (or serve locally with `python -m http.server 8000`).

### Rebuilding the Question Bank

If you add or edit questions in `data/q_part*.json`, regenerate `data/questions.json` and `questions.js` by running:

```bash
python data/merge_questions.py
```
