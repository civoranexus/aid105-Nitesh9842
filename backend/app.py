from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import recommend_schemes, get_scheme_details, compare_schemes
from alerts import generate_alerts, check_eligibility_changes, get_deadline_alerts, get_new_schemes

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend connection

@app.route('/')
def home():
    """Home endpoint to verify server is running"""
    return jsonify({
        "name": "SchemeAssist AI Backend",
        "version": "2.0",
        "endpoints": {
            "health": "/api/health",
            "recommend": "/api/recommend",
            "alerts": "/api/alerts",
            "compare": "/api/compare",
            "eligibility": "/api/eligibility"
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "SchemeAssist AI Backend is running"})

@app.route('/api/recommend', methods=['POST'])
def recommend():
    """Get scheme recommendations based on user profile"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        required_fields = ['state', 'income', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Create user profile with caste category support
        user_profile = {
            "state": data['state'],
            "income": int(data['income']),
            "category": data['category'],
            "age": int(data.get('age', 30)) if data.get('age') else 30,
            "caste_category": data.get('caste_category', 'General')
        }
        
        # Get minimum match score (default 95 for 95-100% matches)
        min_match_score = int(data.get('min_match_score', 95))
        
        # Get recommendations with minimum match filter
        results = recommend_schemes(user_profile, min_match_score)
        
        return jsonify({
            "success": True,
            "count": len(results),
            "min_match_applied": min_match_score,
            "user_caste_category": user_profile['caste_category'],
            "schemes": results
        })
        
    except ValueError as e:
        return jsonify({"error": f"Invalid value: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@app.route('/api/alerts', methods=['POST'])
def get_alerts():
    """Get personalized alerts for user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_profile = {
            "state": data.get('state', 'All'),
            "income": int(data.get('income', 0)),
            "category": data.get('category', ''),
            "age": int(data.get('age', 30)) if data.get('age') else 30
        }
        
        alerts = generate_alerts(user_profile)
        new_schemes = get_new_schemes(user_profile, days=60)
        deadline_alerts = get_deadline_alerts(user_profile)
        
        return jsonify({
            "success": True,
            "alerts": alerts,
            "new_schemes": new_schemes,
            "deadlines": deadline_alerts,
            "total_count": alerts['count'] + len(new_schemes) + len(deadline_alerts)
        })
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@app.route('/api/compare', methods=['POST'])
def compare():
    """Compare multiple schemes in detail"""
    try:
        data = request.get_json()
        
        if not data or 'scheme_names' not in data:
            return jsonify({"error": "No schemes provided for comparison"}), 400
        
        scheme_names = data['scheme_names']
        user_profile = data.get('user_profile', {})
        
        if len(scheme_names) < 2:
            return jsonify({"error": "Please provide at least 2 schemes to compare"}), 400
        
        if len(scheme_names) > 4:
            return jsonify({"error": "Maximum 4 schemes can be compared"}), 400
        
        comparison_result = compare_schemes(scheme_names, user_profile)
        
        return jsonify({
            "success": True,
            "comparison": comparison_result
        })
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@app.route('/api/eligibility', methods=['POST'])
def check_eligibility():
    """Check eligibility changes based on income change"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_profile = {
            "state": data.get('state', 'All'),
            "income": int(data.get('income', 0)),
            "category": data.get('category', ''),
            "age": int(data.get('age', 30)) if data.get('age') else 30
        }
        
        income_change = int(data.get('income_change', 0))
        
        result = check_eligibility_changes(user_profile, income_change)
        
        return jsonify({
            "success": True,
            "eligibility_changes": result
        })
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


if __name__ == "__main__":
    print("=== SchemeAssist AI Backend ===")
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, port=5000)
