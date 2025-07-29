from flask import Blueprint, render_template

users = Blueprint("users", __name__, template_folder="templates")

@users.route('/dashboard')
def profile():
    return render_template('users/profile.html')

@users.route('/login')
def login():
    return render_template('users/login.html')

@users.route('/register')
def register():
    return render_template('users/register.html')