import csv
import os

def load_schemes():
    schemes = []
    # Get the path relative to this file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(current_dir, "..", "data", "schemes.csv")
    
    with open(csv_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            schemes.append(row)
    return schemes


def recommend_schemes(user_profile):
    schemes = load_schemes()
    recommended = []

    for scheme in schemes:
        if scheme["is_active"] != "Yes":
            continue

        if scheme["state"] != "All" and scheme["state"] != user_profile["state"]:
            continue

        income = user_profile["income"]
        min_income = int(scheme["min_income"])
        max_income = int(scheme["max_income"])

        if min_income <= income <= max_income:
            score = 0
            score += 50
            if scheme["category"] == user_profile["category"]:
                score += 30

            recommended.append({
                "scheme_name": scheme["scheme_name"],
                "category": scheme["category"],
                "score": score,
                "last_updated": scheme["last_updated"]
            })

    recommended.sort(key=lambda x: x["score"], reverse=True)
    return recommended
