import json
import pathlib
from collections import Counter

data_dir = pathlib.Path(__file__).parent
files = sorted(data_dir.glob("q_part*.json"))
all_questions = []
seen_ids = set()

for f in files:
    items = json.loads(f.read_text(encoding="utf-8"))
    for q in items:
        qid = q["id"]
        assert len(q["options"]) == 4, f"Options length != 4 in {qid}"
        assert 0 <= q["correctIndex"] < 4, f"Invalid correctIndex in {qid}"
        assert qid not in seen_ids, f"Duplicate id {qid}"
        seen_ids.add(qid)
        all_questions.append(q)

all_questions.sort(key=lambda x: (x["sectionId"], int(x["id"].split("-q")[1])))
out_json = data_dir / "questions.json"
out_json.write_text(json.dumps(all_questions, indent=2, ensure_ascii=False), encoding="utf-8")

out_js = data_dir.parent / "questions.js"
out_js.write_text("window.QUESTION_BANK = " + json.dumps(all_questions, indent=2, ensure_ascii=False) + ";\n", encoding="utf-8")

counts = Counter((q["sectionId"], q["sectionTitle"]) for q in all_questions)
print(f"Total questions merged: {len(all_questions)}")
for (sid, title), cnt in sorted(counts.items()):
    print(f"  {title}: {cnt} questions")
