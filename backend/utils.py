"""
Utility functions for SchemeAssist AI Backend
Provides common helper functions used across the application
"""

import os
import csv
from datetime import datetime
import json


def validate_user_profile(user_profile):
    """
    Validate user profile data
    
    Args:
        user_profile (dict): User profile containing state, income, category
        
    Returns:
        tuple: (is_valid, error_message)
    """
    required_fields = ['state', 'income', 'category']
    
    for field in required_fields:
        if field not in user_profile:
            return False, f"Missing required field: {field}"
    
    # Validate income is a positive number
    try:
        income = int(user_profile['income'])
        if income < 0:
            return False, "Income must be a positive number"
    except (ValueError, TypeError):
        return False, "Income must be a valid number"
    
    # Validate state is not empty
    if not user_profile['state'] or user_profile['state'].strip() == '':
        return False, "State cannot be empty"
    
    # Validate category is not empty
    if not user_profile['category'] or user_profile['category'].strip() == '':
        return False, "Category cannot be empty"
    
    return True, None


def get_data_path(filename):
    """
    Get absolute path to a file in the data directory
    
    Args:
        filename (str): Name of the file
        
    Returns:
        str: Absolute path to the file
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(current_dir, "..", "data", filename)


def load_csv_data(filename):
    """
    Load data from a CSV file in the data directory
    
    Args:
        filename (str): Name of the CSV file
        
    Returns:
        list: List of dictionaries containing the CSV data
    """
    data = []
    file_path = get_data_path(filename)
    
    try:
        with open(file_path, newline="", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                data.append(row)
    except FileNotFoundError:
        print(f"Error: File {filename} not found at {file_path}")
    except Exception as e:
        print(f"Error loading {filename}: {str(e)}")
    
    return data


def format_currency(amount):
    """
    Format amount in Indian currency format
    
    Args:
        amount (int): Amount to format
        
    Returns:
        str: Formatted currency string
    """
    if amount >= 100000:
        return f"₹{amount/100000:.2f} Lakh"
    elif amount >= 1000:
        return f"₹{amount/1000:.2f}K"
    else:
        return f"₹{amount}"


def calculate_days_since_update(date_string):
    """
    Calculate days since a scheme was last updated
    
    Args:
        date_string (str): Date in YYYY-MM-DD format
        
    Returns:
        int: Number of days since update
    """
    try:
        last_updated = datetime.strptime(date_string, "%Y-%m-%d")
        today = datetime.now()
        delta = today - last_updated
        return delta.days
    except:
        return -1


def filter_active_schemes(schemes):
    """
    Filter only active schemes
    
    Args:
        schemes (list): List of scheme dictionaries
        
    Returns:
        list: List of active schemes only
    """
    return [scheme for scheme in schemes if scheme.get('is_active', 'No') == 'Yes']


def categorize_by_priority(schemes):
    """
    Categorize schemes by priority levels
    
    Args:
        schemes (list): List of scheme dictionaries with scores
        
    Returns:
        dict: Dictionary with high, medium, low priority schemes
    """
    categorized = {
        'high': [],
        'medium': [],
        'low': []
    }
    
    for scheme in schemes:
        score = scheme.get('score', 0)
        if score >= 70:
            categorized['high'].append(scheme)
        elif score >= 40:
            categorized['medium'].append(scheme)
        else:
            categorized['low'].append(scheme)
    
    return categorized


def get_scheme_statistics(schemes):
    """
    Get statistics about schemes
    
    Args:
        schemes (list): List of schemes
        
    Returns:
        dict: Statistics about the schemes
    """
    if not schemes:
        return {
            'total': 0,
            'by_category': {},
            'by_level': {},
            'active_count': 0
        }
    
    stats = {
        'total': len(schemes),
        'by_category': {},
        'by_level': {},
        'active_count': 0
    }
    
    for scheme in schemes:
        # Count by category
        category = scheme.get('category', 'Unknown')
        stats['by_category'][category] = stats['by_category'].get(category, 0) + 1
        
        # Count by level
        level = scheme.get('level', 'Unknown')
        stats['by_level'][level] = stats['by_level'].get(level, 0) + 1
        
        # Count active schemes
        if scheme.get('is_active') == 'Yes':
            stats['active_count'] += 1
    
    return stats


def log_request(user_profile, results_count):
    """
    Log recommendation request for analytics
    
    Args:
        user_profile (dict): User profile data
        results_count (int): Number of recommendations returned
    """
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'state': user_profile.get('state'),
        'income': user_profile.get('income'),
        'category': user_profile.get('category'),
        'results_count': results_count
    }
    
    # In a production environment, this would write to a proper logging system
    print(f"[LOG] Recommendation request: {json.dumps(log_entry)}")
