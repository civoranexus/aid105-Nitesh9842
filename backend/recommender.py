import csv
import os

def load_schemes():
    schemes = []
    # Get the path relative to this file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(current_dir, "..", "data", "combined_schemes.csv")
    
    with open(csv_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            schemes.append(row)
    return schemes


# Valid caste categories
CASTE_CATEGORIES = ["SC", "ST", "OBC", "BC", "General", "All"]


def recommend_schemes(user_profile, min_match_score=95):
    """
    Recommend schemes based on user profile.
    Only returns schemes with 95-100% match score by default.
    
    Args:
        user_profile: dict with keys - state, income, age, category, caste_category
        min_match_score: minimum eligibility score (default 95 for 95-100% matches)
    """
    schemes = load_schemes()
    recommended = []

    for scheme in schemes:
        if scheme["is_active"] != "Yes":
            continue

        if scheme["state"] != "All" and scheme["state"] != user_profile.get("state"):
            continue

        income = user_profile.get("income", 0)
        min_income = int(scheme["min_income"])
        max_income = int(scheme["max_income"])

        if min_income <= income <= max_income:
            # Calculate eligibility score
            score = calculate_eligibility_score(scheme, user_profile)
            
            # Only include schemes with 95-100% match
            if score < min_match_score:
                continue
            
            # Check age eligibility if provided
            age = user_profile.get("age", 30)
            min_age = int(scheme.get("min_age", 0))
            max_age = int(scheme.get("max_age", 100))
            
            age_eligible = min_age <= age <= max_age
            
            # Check caste category eligibility
            user_caste = user_profile.get("caste_category", "General").upper()
            scheme_target = scheme.get("target_group", "").upper()
            caste_eligible = check_caste_eligibility(user_caste, scheme_target)
            
            if not caste_eligible:
                continue
            
            recommended.append({
                "scheme_id": scheme.get("scheme_id", ""),
                "scheme_name": scheme["scheme_name"],
                "category": scheme["category"],
                "caste_category": get_scheme_caste_category(scheme_target),
                "score": score,
                "match_percentage": f"{score}%",
                "last_updated": scheme["last_updated"],
                "benefits": scheme.get("benefits", ""),
                "target_group": scheme.get("target_group", ""),
                "min_income": min_income,
                "max_income": max_income,
                "min_age": min_age,
                "max_age": max_age,
                "level": scheme.get("level", "Central"),
                "state": scheme.get("state", "All"),
                "age_eligible": age_eligible,
                "caste_eligible": caste_eligible
            })

    recommended.sort(key=lambda x: x["score"], reverse=True)
    return recommended


def check_caste_eligibility(user_caste, scheme_target):
    """
    Check if user's caste category is eligible for the scheme.
    
    Args:
        user_caste: User's caste category (SC, ST, OBC, BC, General)
        scheme_target: Scheme's target group text
    """
    # Normalize user caste
    user_caste = user_caste.upper().strip()
    if user_caste == "BC":
        user_caste = "OBC"  # BC and OBC are same
    
    # If scheme is for all citizens or eligible citizens, everyone is eligible
    general_keywords = ["ALL CITIZENS", "ELIGIBLE CITIZENS", "ALL HOUSEHOLDS", "ALL"]
    if any(keyword in scheme_target for keyword in general_keywords):
        return True
    
    # Check for specific caste categories in target group
    caste_keywords = {
        "SC": ["SC", "SCHEDULED CASTE", "SCHEDULED CASTES"],
        "ST": ["ST", "SCHEDULED TRIBE", "SCHEDULED TRIBES", "TRIBAL"],
        "OBC": ["OBC", "BC", "OTHER BACKWARD", "BACKWARD CLASS", "BACKWARD CLASSES"],
        "GENERAL": ["GENERAL", "UNRESERVED"]
    }
    
    # Check if scheme targets specific caste
    scheme_castes = []
    for caste, keywords in caste_keywords.items():
        if any(keyword in scheme_target for keyword in keywords):
            scheme_castes.append(caste)
    
    # If no specific caste mentioned, assume open to all
    if not scheme_castes:
        return True
    
    # Check if user's caste matches scheme's target castes
    return user_caste in scheme_castes


def get_scheme_caste_category(target_group):
    """
    Extract caste category from scheme's target group.
    Returns: SC, ST, OBC, General, or All
    """
    target_upper = target_group.upper()
    
    categories = []
    
    if "SC" in target_upper or "SCHEDULED CASTE" in target_upper:
        categories.append("SC")
    if "ST" in target_upper or "SCHEDULED TRIBE" in target_upper or "TRIBAL" in target_upper:
        categories.append("ST")
    if "OBC" in target_upper or "BC" in target_upper or "BACKWARD CLASS" in target_upper:
        categories.append("OBC")
    
    if not categories:
        return "All"  # Open to all categories
    
    return ", ".join(categories)


def calculate_eligibility_score(scheme, user_profile):
    """
    Calculate a comprehensive eligibility score (0-100).
    Higher score means better match for the user.
    """
    score = 0
    
    # Base score for income match (25 points)
    score += 25
    
    # Category match bonus (25 points)
    if scheme["category"] == user_profile.get("category"):
        score += 25
    elif user_profile.get("category") in ["Social Welfare", "Education", "Health"]:
        # Partial match for related categories
        score += 10
    
    # Age match bonus (20 points)
    age = user_profile.get("age", 30)
    min_age = int(scheme.get("min_age", 0))
    max_age = int(scheme.get("max_age", 100))
    
    if min_age <= age <= max_age:
        score += 20
    
    # Caste category match bonus (20 points)
    user_caste = user_profile.get("caste_category", "General").upper()
    scheme_target = scheme.get("target_group", "").upper()
    
    if check_caste_eligibility(user_caste, scheme_target):
        # Check if scheme specifically targets user's caste
        caste_specific_match = False
        if user_caste == "SC" and ("SC" in scheme_target or "SCHEDULED CASTE" in scheme_target):
            caste_specific_match = True
        elif user_caste == "ST" and ("ST" in scheme_target or "SCHEDULED TRIBE" in scheme_target):
            caste_specific_match = True
        elif user_caste in ["OBC", "BC"] and ("OBC" in scheme_target or "BC" in scheme_target or "BACKWARD" in scheme_target):
            caste_specific_match = True
        
        if caste_specific_match:
            score += 20  # Full bonus for specific caste match
        else:
            score += 15  # Partial bonus for general eligibility
    
    # State-specific scheme bonus (10 points)
    if scheme.get("state") == user_profile.get("state") and scheme.get("state") != "All":
        score += 10
    elif scheme.get("state") == "All":
        score += 5  # Partial bonus for central schemes
    
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


def search_schemes(query, filters=None):
    """
    Search schemes by keyword with optional filters
    
    Args:
        query: search keyword
        filters: dict with state, category, min_income, max_income, caste_category
    """
    schemes = load_schemes()
    results = []
    
    query_lower = query.lower() if query else ""
    
    for scheme in schemes:
        if scheme["is_active"] != "Yes":
            continue
        
        # Search in name, benefit, and description
        searchable_text = (
            scheme.get("scheme_name", "") + " " +
            scheme.get("benefit", "") + " " +
            scheme.get("category", "")
        ).lower()
        
        if query and query_lower not in searchable_text:
            continue
        
        # Apply filters
        if filters:
            if filters.get('state') and filters['state'] != 'All':
                if scheme["state"] != "All" and scheme["state"] != filters['state']:
                    continue
            
            if filters.get('category'):
                if scheme["category"] != filters['category']:
                    continue
            
            if filters.get('caste_category'):
                caste_cat = filters['caste_category']
                scheme_caste = scheme.get("caste_category", "All")
                if scheme_caste != "All" and scheme_caste != caste_cat:
                    continue
            
            if filters.get('min_income') is not None:
                if int(scheme["max_income"]) < int(filters['min_income']):
                    continue
            
            if filters.get('max_income') is not None:
                if int(scheme["min_income"]) > int(filters['max_income']):
                    continue
        
        results.append(scheme)
    
    return results


def get_scheme_statistics():
    """
    Get comprehensive statistics about available schemes
    """
    schemes = load_schemes()
    active_schemes = [s for s in schemes if s["is_active"] == "Yes"]
    
    # Count by category
    categories = {}
    for scheme in active_schemes:
        cat = scheme.get("category", "Other")
        categories[cat] = categories.get(cat, 0) + 1
    
    # Count by state
    states = {}
    for scheme in active_schemes:
        state = scheme.get("state", "All")
        states[state] = states.get(state, 0) + 1
    
    # Count by caste category
    caste_categories = {}
    for scheme in active_schemes:
        caste = scheme.get("caste_category", "All")
        caste_categories[caste] = caste_categories.get(caste, 0) + 1
    
    # Income range statistics
    income_ranges = {
        "0-100000": 0,
        "100001-300000": 0,
        "300001-500000": 0,
        "500001-1000000": 0,
        "1000000+": 0
    }
    
    for scheme in active_schemes:
        max_inc = int(scheme.get("max_income", 0))
        if max_inc <= 100000:
            income_ranges["0-100000"] += 1
        elif max_inc <= 300000:
            income_ranges["100001-300000"] += 1
        elif max_inc <= 500000:
            income_ranges["300001-500000"] += 1
        elif max_inc <= 1000000:
            income_ranges["500001-1000000"] += 1
        else:
            income_ranges["1000000+"] += 1
    
    return {
        "total_schemes": len(schemes),
        "active_schemes": len(active_schemes),
        "inactive_schemes": len(schemes) - len(active_schemes),
        "categories": categories,
        "states": states,
        "caste_categories": caste_categories,
        "income_ranges": income_ranges,
        "top_categories": sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]
    }

