from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import recommend_schemes

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend connection

@app.route('/')
def home():
    """Home endpoint to verify server is running"""
    return jsonify({
        "name": "SchemeAssist AI Backend",
        "version": "1.0",
        "endpoints": {
            "health": "/api/health",
            "recommend": "/api/recommend"
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
        
        # Create user profile
        user_profile = {
            "state": data['state'],
            "income": int(data['income']),
            "category": data['category']
        }
        
        # Get recommendations
        results = recommend_schemes(user_profile)
        
        return jsonify({
            "success": True,
            "count": len(results),
            "schemes": results
        })
        
    except ValueError as e:
        return jsonify({"error": f"Invalid income value: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == "__main__":
    print("=== SchemeAssist AI Backend ===")
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, port=5000)
