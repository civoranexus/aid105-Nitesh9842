from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from recommender import recommend_schemes, get_scheme_details, compare_schemes, search_schemes, get_scheme_statistics
import json
import os
import hashlib
import secrets
import logging
import traceback
from functools import wraps
from datetime import datetime
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'app.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Storage for user data (in production, use a database)
USERS_FILE = os.path.join(os.path.dirname(__file__), 'users.json')

# Error handler decorator
def handle_errors(f):
    """Decorator to handle errors and return consistent error responses"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error in {f.__name__}: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Invalid JSON',
                'message': 'Failed to parse request data',
                'timestamp': datetime.utcnow().isoformat()
            }), 400
        except ValueError as e:
            logger.warning(f"Validation error in {f.__name__}: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Invalid input',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 400
        except KeyError as e:
            logger.warning(f"Missing key in {f.__name__}: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Missing required field',
                'message': f'Field {str(e)} is required',
                'timestamp': datetime.utcnow().isoformat()
            }), 400
        except FileNotFoundError as e:
            logger.error(f"File not found in {f.__name__}: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Resource not found',
                'message': 'Required data file is missing',
                'timestamp': datetime.utcnow().isoformat()
            }), 500
        except Exception as e:
            logger.error(f"Unexpected error in {f.__name__}: {str(e)}\n{traceback.format_exc()}")
            return jsonify({
                'success': False,
                'error': 'Internal server error',
                'message': 'An unexpected error occurred',
                'timestamp': datetime.utcnow().isoformat()
            }), 500
    return decorated_function
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

# Configure Flask app to serve frontend files
frontend_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')
app = Flask(__name__, 
            template_folder=frontend_folder,
            static_folder=frontend_folder,
            static_url_path='')
CORS(app)  # Enable CORS for frontend connection

@app.route('/api/register', methods=['POST'])
@handle_errors
def register():
    data = request.get_json()
    if not data:
        raise ValueError("No data provided")
    
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        raise ValueError('Username and password required')
    
    if len(username) < 3:
        raise ValueError('Username must be at least 3 characters')
    
    if len(password) < 6:
        raise ValueError('Password must be at least 6 characters')
    
    users = load_users()
    if username in users:
        return jsonify({'success': False, 'message': 'Username already exists.'}), 409
    
    users[username] = {
        'password': hash_password(password),
        'profile': {},
        'token': generate_token()
    }
    save_users(users)
    logger.info(f"New user registered: {username}")
    return jsonify({'success': True, 'message': 'Registration successful.'})

@app.route('/api/login', methods=['POST'])
@handle_errors
def login():
    data = request.get_json()
    if not data:
        raise ValueError("No data provided")
    
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        raise ValueError('Username and password required')
    
    users = load_users()
    user = users.get(username)
    
    if not user or user['password'] != hash_password(password):
        logger.warning(f"Failed login attempt for user: {username}")
        return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401
    
    # Generate new token for session
    user['token'] = generate_token()
    users[username] = user
    save_users(users)
    logger.info(f"User logged in: {username}")
    return jsonify({'success': True, 'token': user['token'], 'message': 'Login successful.'})

@app.route('/api/profile', methods=['GET', 'POST'])
@handle_errors
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
    """Safely load JSON file with error handling"""
    try:
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        logger.info(f"File {filepath} does not exist, returning empty dict")
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode JSON from {filepath}: {str(e)}")
        return {}
    except Exception as e:
        logger.error(f"Error loading {filepath}: {str(e)}")
        return {}

def save_json_file(filepath, data):
    """Safely save JSON file with error handling"""
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Write to temporary file first
        temp_filepath = filepath + '.tmp'
        with open(temp_filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        # Rename to actual file (atomic operation)
        os.replace(temp_filepath, filepath)
        logger.debug(f"Successfully saved data to {filepath}")
    except Exception as e:
        logger.error(f"Error saving to {filepath}: {str(e)}")
        raise

@app.route('/api')
def api_info():
    """API information endpoint"""
    return jsonify({
        "name": "Civora Nexus Backend",
        "version": "3.0",
        "endpoints": {
            "health": "/api/health",
            "recommend": "/api/recommend",
            "compare": "/api/compare",
            "search": "/api/search",
            "statistics": "/api/statistics",
            "favorites": "/api/favorites",
            "applications": "/api/applications",
            "export": "/api/export"
        }
    })

@app.route('/')
def home():
    """Serve the index.html page"""
    return render_template('index.html')

@app.route('/login.html')
def serve_login():
    """Serve the login page"""
    return render_template('login.html')

@app.route('/profile.html')
def serve_profile():
    """Serve the profile page"""
    return render_template('profile.html')

@app.route('/offline.html')
def serve_offline():
    """Serve the offline page"""
    return render_template('offline.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Civora Nexus Backend is running"})

@app.route('/api/recommend', methods=['POST'])
@handle_errors
def recommend():
    """Get scheme recommendations based on user profile"""
    data = request.get_json()
    
    # Validate required fields
    if not data:
        raise ValueError("No data provided")
    
    required_fields = ['state', 'income', 'category']
    for field in required_fields:
        if field not in data:
            raise KeyError(field)
        
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
    logger.info(f"Generated {len(results)} recommendations for state: {user_profile['state']}")
    
    return jsonify({
        "success": True,
        "count": len(results),
        "min_match_applied": min_match_score,
        "user_caste_category": user_profile['caste_category'],
        "schemes": results
    })


@app.route('/api/compare', methods=['POST'])
@handle_errors
def compare():
    """Compare multiple schemes in detail"""
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


@app.route('/api/search', methods=['POST'])
@handle_errors
def search():
    """Search schemes with filters"""
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


@app.route('/api/statistics', methods=['GET'])
@handle_errors
def get_statistics():
    """Get scheme statistics and analytics"""
    stats = get_scheme_statistics()
    
    return jsonify({
        "success": True,
        "statistics": stats
    })


@app.route('/api/favorites', methods=['GET', 'POST', 'DELETE'])
@handle_errors
def manage_favorites():
    """Manage user favorite schemes"""
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
    
    raise ValueError("Invalid request method")


@app.route('/api/applications', methods=['GET', 'POST', 'PUT'])
@handle_errors
def manage_applications():
    """Track scheme application status"""
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
    
    raise ValueError("Invalid request method")


# Storage for feedback data
FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), 'feedback.json')

@app.route('/api/feedback', methods=['POST'])
@handle_errors
def submit_feedback():
    """Submit user feedback"""
    data = request.get_json()
    if not data:
        raise ValueError("No data provided")

    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    feedback_type = data.get('type', '').strip()
    rating = data.get('rating', 0)
    message = data.get('message', '').strip()

    if not name or not email or not message:
        raise ValueError('Name, email, and message are required')

    if not (1 <= int(rating) <= 5):
        raise ValueError('Rating must be between 1 and 5')

    feedback_entry = {
        'name': name,
        'email': email,
        'type': feedback_type,
        'rating': int(rating),
        'message': message,
        'submitted_at': datetime.utcnow().isoformat()
    }

    feedbacks = load_json_file(FEEDBACK_FILE)
    if 'entries' not in feedbacks:
        feedbacks['entries'] = []
    feedbacks['entries'].append(feedback_entry)
    save_json_file(FEEDBACK_FILE, feedbacks)

    logger.info(f"Feedback received from {name} ({feedback_type}), rating: {rating}")
    return jsonify({
        'success': True,
        'message': 'Thank you for your feedback!'
    })


@app.route('/api/export', methods=['POST'])
@handle_errors
def export_data():
    """Export recommendations in various formats"""
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


# Global error handlers
@app.errorhandler(404)
def not_found(error):
    logger.warning(f"404 error: {request.url}")
    return jsonify({
        'success': False,
        'error': 'Not found',
        'message': 'The requested resource was not found',
        'timestamp': datetime.utcnow().isoformat()
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    logger.warning(f"405 error: {request.method} {request.url}")
    return jsonify({
        'success': False,
        'error': 'Method not allowed',
        'message': f'Method {request.method} is not allowed for this endpoint',
        'timestamp': datetime.utcnow().isoformat()
    }), 405

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 error: {str(error)}")
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred',
        'timestamp': datetime.utcnow().isoformat()
    }), 500


if __name__ == "__main__":
    print("=== Civora Nexus Backend ===")
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, port=5000)
