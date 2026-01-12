# 🚀 SchemeAssist AI - Complete Setup Guide

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Recommendations**: Smart scheme matching based on user profile
- **Priority Categorization**: Schemes organized by High, Medium, and Low priority
- **Real-time Alerts**: Get notified about scheme updates and eligibility changes
- **Scheme Comparison**: Compare up to 3 schemes side-by-side
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Beautiful, intuitive interface with smooth animations

### 📊 Sections
1. **Home** - Landing page with statistics
2. **Recommendations** - Get personalized scheme recommendations
3. **Alerts** - Check for updates and eligibility changes
4. **Compare** - Compare multiple schemes
5. **About** - Learn about the system

---

## 🛠️ Prerequisites

- **Python 3.8+** installed
- **pip** package manager
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Code editor (VS Code recommended)

---

## 📥 Installation Steps

### 1️⃣ Clone/Download the Project
```bash
cd d:\SchemeAssist-AI\aid105-Nitesh9842
```

### 2️⃣ Create Virtual Environment
```bash
python -m venv venv
```

### 3️⃣ Activate Virtual Environment

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 4️⃣ Install Dependencies
```bash
pip install -r requirements.txt
```

If requirements.txt is missing packages, install manually:
```bash
pip install Flask==3.0.0 flask-cors==4.0.0
```

---

## 🎮 Running the Application

### Backend Server

1. Open a terminal in VS Code
2. Navigate to backend folder:
```bash
cd backend
```

3. Run the Flask server:
```bash
python app.py
```

You should see:
```
=== SchemeAssist AI Backend ===
Starting Flask server on http://localhost:5000
 * Running on http://127.0.0.1:5000
```

**Keep this terminal running!**

### Frontend Application

**Option 1: Direct File Open (Simple)**
- Navigate to `frontend` folder
- Double-click `index.html` to open in browser

**Option 2: Local Server (Recommended)**

Open a NEW terminal:
```bash
cd frontend
python -m http.server 8000
```

Then open: http://localhost:8000

---

## 🔥 Quick Start Guide

### Step 1: Start Backend
```bash
cd backend
python app.py
```

### Step 2: Open Frontend
- Open `frontend/index.html` in your browser, OR
- Run `python -m http.server 8000` in frontend folder

### Step 3: Use the Application

1. **Click "Get Started"** on the home page
2. **Fill in your profile:**
   - Select your state
   - Enter annual income
   - Choose interest category
   - (Optional) Enter age

3. **Click "Find Schemes"**
   - View all recommendations
   - See priority-based categorization
   - Click "Compare" on schemes you want to compare

4. **Check Alerts:**
   - Navigate to Alerts section
   - Click "Check for Updates"
   - See recently updated schemes

5. **Compare Schemes:**
   - Go to Compare section
   - Select 2-3 schemes
   - Click "Compare Selected"
   - View side-by-side comparison

---

## 📁 Project Structure

```
aid105-Nitesh9842/
├── backend/
│   ├── app.py              # Flask API server
│   ├── recommender.py      # Recommendation engine
│   ├── utils.py            # Helper functions
│   └── alerts.py           # Alert system
├── frontend/
│   ├── index.html          # Main HTML (Complete UI)
│   ├── style.css           # Styles (Modern design)
│   └── script.js           # JavaScript (Full functionality)
├── data/
│   └── schemes.csv         # 40+ Government schemes database
├── tests/
│   └── test_recommender.py # Unit tests
├── .vscode/
│   └── settings.json       # VS Code configuration
└── requirements.txt        # Python dependencies
```

---

## 🔌 API Endpoints

### Health Check
```
GET http://localhost:5000/api/health
```

### Get Recommendations
```
POST http://localhost:5000/api/recommend
Content-Type: application/json

{
  "state": "Maharashtra",
  "income": 150000,
  "category": "Agriculture"
}
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "schemes": [
    {
      "scheme_name": "PM Kisan Samman Nidhi",
      "category": "Agriculture",
      "score": 80,
      "last_updated": "2025-01-01"
    }
  ]
}
```

---

## 🐛 Troubleshooting

### ❌ Import Errors in VS Code

**Problem:** "Import 'recommender' could not be resolved"

**Solution:**
1. Press `Ctrl + Shift + P`
2. Type "Python: Select Interpreter"
3. Choose the interpreter in `venv` folder
4. Reload VS Code (`Ctrl + Shift + P` → "Reload Window")

The `.vscode/settings.json` file is already configured!

### ❌ Backend Not Starting

**Problem:** Port 5000 already in use

**Solution 1:** Kill the process using port 5000
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

**Solution 2:** Change the port in `backend/app.py`:
```python
app.run(debug=True, port=5001)
```
And update `frontend/script.js`:
```javascript
const API_URL = 'http://localhost:5001/api';
```

### ❌ CORS Errors

**Problem:** Frontend can't connect to backend

**Solution:** 
- Make sure `flask-cors` is installed
- Check that backend is running
- Verify API_URL in `script.js` matches backend port

### ❌ No Schemes Found

**Problem:** Recommendations return empty

**Solution:**
- Try selecting "All" for state
- Use income between 50,000 - 500,000
- Check `data/schemes.csv` exists and has data

---

## 🧪 Running Tests

```bash
cd tests
python test_recommender.py
```

Expected output:
```
=== SchemeAssist AI - Test Suite ===
✓ test_load_schemes PASSED
✓ test_recommend_schemes_basic PASSED
✓ test_recommend_schemes_filtering PASSED
✓ test_recommend_schemes_scoring PASSED
✓ test_validate_user_profile PASSED
✓ test_categorize_by_priority PASSED

Test Results: 6 passed, 0 failed
```

---

## 🎨 Features Implemented

### Frontend Features
✅ Modern, responsive navigation  
✅ Hero section with statistics  
✅ Multi-section layout (Home, Recommend, Alerts, Compare, About)  
✅ Form validation  
✅ Real-time API integration  
✅ Loading overlay  
✅ Toast notifications  
✅ Priority-based scheme display  
✅ Scheme comparison (up to 3 schemes)  
✅ Alert system  
✅ Mobile responsive design  
✅ Smooth animations  
✅ Error handling  

### Backend Features
✅ Flask REST API  
✅ CORS enabled  
✅ CSV data loading  
✅ Scheme filtering by state and income  
✅ Score-based ranking  
✅ Category matching bonus  
✅ Health check endpoint  
✅ Error handling  

---

## 🌟 Usage Examples

### Example 1: Farmer in Maharashtra
```
State: Maharashtra (or "All")
Income: ₹150,000
Category: Agriculture
```
**Expected Results:** PM Kisan Samman Nidhi, Agriculture schemes

### Example 2: Small Business Owner
```
State: All
Income: ₹300,000
Category: Business
```
**Expected Results:** MUDRA Yojana, Stand Up India, Startup India

### Example 3: Student
```
State: All
Income: ₹100,000
Category: Education
```
**Expected Results:** SWAYAM, Skill India Mission

---

## 📱 Browser Compatibility

✅ Chrome 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Edge 90+  
✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🔐 Security Note

This is a demonstration project. For production:
- Add authentication
- Use HTTPS
- Implement rate limiting
- Add input sanitization
- Use environment variables for configuration
- Add database instead of CSV
- Implement proper logging

---

## 📞 Support

If you encounter any issues:
1. Check this README's troubleshooting section
2. Verify backend is running: http://localhost:5000/api/health
3. Check browser console for errors (F12)
4. Check terminal for backend errors

---

## 🎯 Next Steps

After successful setup, you can:
1. Add more schemes to `data/schemes.csv`
2. Customize scoring logic in `backend/recommender.py`
3. Enhance UI in `frontend/style.css`
4. Add new features in `frontend/script.js`
5. Create more endpoints in `backend/app.py`

---

## 📄 License

This project is open source and available for educational purposes.

---

## 🙏 Acknowledgments

- Flask Framework
- Font Awesome Icons
- Government of India Schemes Data

---

**Made with ❤️ for India**

*Last Updated: January 12, 2026*
