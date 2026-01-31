from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import recommend_schemes, get_scheme_details, compare_schemes, search_schemes, get_scheme_statistics
from alerts import generate_alerts, check_eligibility_changes, get_deadline_alerts, get_new_schemes
import json
import os
import hashlib
import secrets
# Storage for user data (in production, use a database)
USERS_FILE = os.path.join(os.path.dirname(__file__), 'users.json')
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token():
    return secrets.token_hex(16)

def load_users():
    return load_json_file(USERS_FILE)

def save_users(users):
    save_json_file(USERS_FILE, users)

def get_user_profile(username):
    users = load_users()
    return users.get(username, {}).get('profile', {})

def update_user_profile(username, profile):
    users = load_users()
    if username in users:
        users[username]['profile'] = profile
        save_users(users)
        return True
    return False

# --- AUTHENTICATION ENDPOINTS ---

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend connection

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required.'}), 400
    users = load_users()
    if username in users:
        return jsonify({'success': False, 'message': 'Username already exists.'}), 409
    users[username] = {
        'password': hash_password(password),
        'profile': {},
        'token': generate_token()
    }
    save_users(users)
    return jsonify({'success': True, 'message': 'Registration successful.'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required.'}), 400
    users = load_users()
    user = users.get(username)
    if not user or user['password'] != hash_password(password):
        return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401
    # Generate new token for session
    user['token'] = generate_token()
    users[username] = user
    save_users(users)
    return jsonify({'success': True, 'token': user['token'], 'message': 'Login successful.'})

@app.route('/api/profile', methods=['GET', 'POST'])
def profile():
    token = request.headers.get('Authorization')
    users = load_users()
    username = None
    for user, info in users.items():
        if info.get('token') == token:
            username = user
            break
    if not username:
        response = jsonify({'success': False, 'message': 'Unauthorized'})
        response.status_code = 401
        return response
    if request.method == 'GET':
        return jsonify({'success': True, 'profile': users[username].get('profile', {})})
    elif request.method == 'POST':
        profile_data = request.get_json()
        users[username]['profile'] = profile_data
        save_users(users)
        return jsonify({'success': True, 'message': 'Profile updated.'})
    # Always return a response for all code paths
    return jsonify({'success': False, 'message': 'Invalid request method.'}), 405

# Storage for user data (in production, use a database)
FAVORITES_FILE = os.path.join(os.path.dirname(__file__), 'user_favorites.json')
APPLICATIONS_FILE = os.path.join(os.path.dirname(__file__), 'user_applications.json')

def load_json_file(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return {}

def save_json_file(filepath, data):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/')
def home():
    """Home endpoint to verify server is running"""
    return jsonify({
        "name": "SchemeAssist AI Backend",
        "version": "3.0",
        "endpoints": {
            "health": "/api/health",
            "recommend": "/api/recommend",
            "alerts": "/api/alerts",
            "compare": "/api/compare",
            "eligibility": "/api/eligibility",
            "search": "/api/search",
            "statistics": "/api/statistics",
            "favorites": "/api/favorites",
            "applications": "/api/applications",
            "export": "/api/export"
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


@app.route('/api/search', methods=['POST'])
def search():
    """Search schemes with filters"""
    try:
        data = request.get_json()
        
        search_query = data.get('query', '')
        filters = {
            'state': data.get('state'),
            'category': data.get('category'),
            'min_income': data.get('min_income'),
            'max_income': data.get('max_income'),
            'caste_category': data.get('caste_category')
        }
        
        results = search_schemes(search_query, filters)
        
        return jsonify({
            "success": True,
            "count": len(results),
            "schemes": results
        })
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get scheme statistics and analytics"""
    try:
        stats = get_scheme_statistics()
        
        return jsonify({
            "success": True,
            "statistics": stats
        })
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@app.route('/api/favorites', methods=['GET', 'POST', 'DELETE'])
def manage_favorites():
    """Manage user favorite schemes"""
    try:
        favorites = load_json_file(FAVORITES_FILE)
        user_id = request.args.get('user_id', 'default_user')
        
        if request.method == 'GET':
            user_favorites = favorites.get(user_id, [])
            return jsonify({
                "success": True,
                "favorites": user_favorites,
                "count": len(user_favorites)
            })
        
        elif request.method == 'POST':
            data = request.get_json()
            scheme_name = data.get('scheme_name')
            
            if not scheme_name:
                return jsonify({"error": "scheme_name is required"}), 400
            
            if user_id not in favorites:
                favorites[user_id] = []
            
            if scheme_name not in favorites[user_id]:
                favorites[user_id].append(scheme_name)
                save_json_file(FAVORITES_FILE, favorites)
            
            return jsonify({
                "success": True,
                "message": "Scheme added to favorites",
                "favorites": favorites[user_id]
            })
        
        elif request.method == 'DELETE':
            data = request.get_json()
            scheme_name = data.get('scheme_name')
            
            if user_id in favorites and scheme_name in favorites[user_id]:
                favorites[user_id].remove(scheme_name)
                save_json_file(FAVORITES_FILE, favorites)
            
            return jsonify({
                "success": True,
                "message": "Scheme removed from favorites",
                "favorites": favorites.get(user_id, [])
            })
        
        return jsonify({"error": "Invalid request method"}), 400
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@app.route('/api/applications', methods=['GET', 'POST', 'PUT'])
def manage_applications():
    """Track scheme application status"""
    try:
        applications = load_json_file(APPLICATIONS_FILE)
        user_id = request.args.get('user_id', 'default_user')
        
        if request.method == 'GET':
            user_apps = applications.get(user_id, [])
            return jsonify({
                "success": True,
                "applications": user_apps,
                "count": len(user_apps)
            })
        
        elif request.method == 'POST':
            data = request.get_json()
            scheme_name = data.get('scheme_name')
            status = data.get('status', 'planned')
            
            if not scheme_name:
                return jsonify({"error": "scheme_name is required"}), 400
            
            if user_id not in applications:
                applications[user_id] = []
            
            # Check if already exists
            existing = next((app for app in applications[user_id] if app['scheme_name'] == scheme_name), None)
            if not existing:
                applications[user_id].append({
                    "scheme_name": scheme_name,
                    "status": status,
                    "applied_date": data.get('applied_date', ''),
                    "notes": data.get('notes', '')
                })
                save_json_file(APPLICATIONS_FILE, applications)
            
            return jsonify({
                "success": True,
                "message": "Application tracked",
                "applications": applications[user_id]
            })
        
        elif request.method == 'PUT':
            data = request.get_json()
            scheme_name = data.get('scheme_name')
            status = data.get('status')
            
            if user_id in applications:
                for app in applications[user_id]:
                    if app['scheme_name'] == scheme_name:
                        if status:
                            app['status'] = status
                        if 'notes' in data:
                            app['notes'] = data['notes']
                        if 'applied_date' in data:
                            app['applied_date'] = data['applied_date']
                        break
                save_json_file(APPLICATIONS_FILE, applications)
            
            return jsonify({
                "success": True,
                "message": "Application updated",
                "applications": applications.get(user_id, [])
            })
        
        return jsonify({"error": "Invalid request method"}), 400
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@app.route('/api/export', methods=['POST'])
def export_data():
    """Export recommendations in various formats"""
    try:
        data = request.get_json()
        schemes = data.get('schemes', [])
        format_type = data.get('format', 'json')
        
        if format_type == 'csv':
            # Create CSV formatted string
            csv_data = "Scheme Name,Category,State,Benefit,Min Income,Max Income,Eligibility Score\n"
            for scheme in schemes:
                csv_data += f'"{scheme.get("scheme_name", "")}","{scheme.get("category", "")}","{scheme.get("state", "")}","{scheme.get("benefit", "")}",{scheme.get("min_income", 0)},{scheme.get("max_income", 0)},{scheme.get("eligibility_score", 0)}\n'
            
            return jsonify({
                "success": True,
                "data": csv_data,
                "format": "csv"
            })
        
        else:  # JSON format
            return jsonify({
                "success": True,
                "data": schemes,
                "format": "json"
            })
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


if __name__ == "__main__":
    print("=== SchemeAssist AI Backend ===")
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, port=5000)
