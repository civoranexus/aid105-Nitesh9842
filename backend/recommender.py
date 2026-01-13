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
            # Calculate eligibility score
            score = calculate_eligibility_score(scheme, user_profile)
            
            # Check age eligibility if provided
            age = user_profile.get("age", 30)
            min_age = int(scheme.get("min_age", 0))
            max_age = int(scheme.get("max_age", 100))
            
            age_eligible = min_age <= age <= max_age
            
            recommended.append({
                "scheme_id": scheme.get("scheme_id", ""),
                "scheme_name": scheme["scheme_name"],
                "category": scheme["category"],
                "score": score,
                "last_updated": scheme["last_updated"],
                "benefits": scheme.get("benefits", ""),
                "target_group": scheme.get("target_group", ""),
                "min_income": min_income,
                "max_income": max_income,
                "min_age": min_age,
                "max_age": max_age,
                "level": scheme.get("level", "Central"),
                "state": scheme.get("state", "All"),
                "age_eligible": age_eligible
            })

    recommended.sort(key=lambda x: x["score"], reverse=True)
    return recommended


def calculate_eligibility_score(scheme, user_profile):
    """Calculate a comprehensive eligibility score"""
    score = 0
    
    # Base score for income match
    score += 40
    
    # Category match bonus
    if scheme["category"] == user_profile["category"]:
        score += 35
    
    # Age match bonus
    age = user_profile.get("age", 30)
    min_age = int(scheme.get("min_age", 0))
    max_age = int(scheme.get("max_age", 100))
    
    if min_age <= age <= max_age:
        score += 15
        # Bonus for optimal age range
        age_range = max_age - min_age
        if age_range > 0:
            age_position = (age - min_age) / age_range
            if 0.2 <= age_position <= 0.8:
                score += 5
    
    # State-specific scheme bonus
    if scheme.get("state") == user_profile.get("state") and scheme.get("state") != "All":
        score += 5
    
    return min(score, 100)


def get_scheme_details(scheme_name):
    """Get detailed information about a specific scheme"""
    schemes = load_schemes()
    
    for scheme in schemes:
        if scheme["scheme_name"] == scheme_name:
            return {
                "scheme_id": scheme.get("scheme_id", ""),
                "scheme_name": scheme["scheme_name"],
                "level": scheme.get("level", "Central"),
                "state": scheme.get("state", "All"),
                "category": scheme["category"],
                "min_age": int(scheme.get("min_age", 0)),
                "max_age": int(scheme.get("max_age", 100)),
                "min_income": int(scheme.get("min_income", 0)),
                "max_income": int(scheme.get("max_income", 999999)),
                "target_group": scheme.get("target_group", ""),
                "benefits": scheme.get("benefits", ""),
                "is_active": scheme.get("is_active", "Yes"),
                "last_updated": scheme.get("last_updated", "")
            }
    
    return None


def compare_schemes(scheme_names, user_profile=None):
    """Compare multiple schemes with detailed analysis"""
    schemes = load_schemes()
    comparison_data = []
    
    for name in scheme_names:
        for scheme in schemes:
            if scheme["scheme_name"] == name:
                scheme_data = {
                    "scheme_id": scheme.get("scheme_id", ""),
                    "scheme_name": scheme["scheme_name"],
                    "level": scheme.get("level", "Central"),
                    "state": scheme.get("state", "All"),
                    "category": scheme["category"],
                    "min_age": int(scheme.get("min_age", 0)),
                    "max_age": int(scheme.get("max_age", 100)),
                    "age_range": f"{scheme.get('min_age', 0)} - {scheme.get('max_age', 100)} years",
                    "min_income": int(scheme.get("min_income", 0)),
                    "max_income": int(scheme.get("max_income", 999999)),
                    "income_range": format_income_range(
                        int(scheme.get("min_income", 0)),
                        int(scheme.get("max_income", 999999))
                    ),
                    "target_group": scheme.get("target_group", "All Citizens"),
                    "benefits": scheme.get("benefits", "Various benefits"),
                    "is_active": scheme.get("is_active", "Yes"),
                    "last_updated": scheme.get("last_updated", ""),
                    "eligibility_score": 0
                }
                
                # Calculate eligibility score if user profile provided
                if user_profile:
                    scheme_data["eligibility_score"] = calculate_eligibility_score(scheme, user_profile)
                
                comparison_data.append(scheme_data)
                break
    
    # Add comparison insights
    insights = generate_comparison_insights(comparison_data, user_profile)
    
    return {
        "schemes": comparison_data,
        "insights": insights,
        "recommendation": get_best_scheme_recommendation(comparison_data, user_profile)
    }


def format_income_range(min_income, max_income):
    """Format income range for display"""
    if max_income >= 999999:
        return f"₹{min_income:,}+"
    return f"₹{min_income:,} - ₹{max_income:,}"


def generate_comparison_insights(schemes, user_profile):
    """Generate insights from scheme comparison"""
    insights = []
    
    if not schemes:
        return insights
    
    # Income range comparison
    income_ranges = [(s["min_income"], s["max_income"]) for s in schemes]
    widest_range = max(schemes, key=lambda x: x["max_income"] - x["min_income"])
    insights.append({
        "type": "income",
        "title": "Income Flexibility",
        "message": f"{widest_range['scheme_name']} has the widest income eligibility range",
        "icon": "rupee-sign"
    })
    
    # Age range comparison
    age_ranges = [(s["min_age"], s["max_age"]) for s in schemes]
    widest_age = max(schemes, key=lambda x: x["max_age"] - x["min_age"])
    insights.append({
        "type": "age",
        "title": "Age Coverage",
        "message": f"{widest_age['scheme_name']} covers the widest age group ({widest_age['age_range']})",
        "icon": "users"
    })
    
    # Category distribution
    categories = [s["category"] for s in schemes]
    unique_categories = set(categories)
    if len(unique_categories) > 1:
        insights.append({
            "type": "category",
            "title": "Category Diversity",
            "message": f"Comparing schemes across {len(unique_categories)} different categories: {', '.join(unique_categories)}",
            "icon": "th-large"
        })
    
    # User eligibility insight
    if user_profile:
        eligible_count = sum(1 for s in schemes if s.get("eligibility_score", 0) >= 50)
        insights.append({
            "type": "eligibility",
            "title": "Your Eligibility",
            "message": f"You have good eligibility (score ≥50) for {eligible_count} out of {len(schemes)} compared schemes",
            "icon": "check-circle"
        })
    
    return insights


def get_best_scheme_recommendation(schemes, user_profile):
    """Get the best scheme recommendation from comparison"""
    if not schemes:
        return None
    
    if user_profile:
        # Sort by eligibility score
        sorted_schemes = sorted(schemes, key=lambda x: x.get("eligibility_score", 0), reverse=True)
        best = sorted_schemes[0]
        return {
            "scheme_name": best["scheme_name"],
            "reason": f"Best match with eligibility score of {best['eligibility_score']}",
            "score": best["eligibility_score"]
        }
    
    # Without user profile, return the most recently updated
    sorted_schemes = sorted(schemes, key=lambda x: x.get("last_updated", ""), reverse=True)
    return {
        "scheme_name": sorted_schemes[0]["scheme_name"],
        "reason": "Most recently updated scheme",
        "score": None
    }
