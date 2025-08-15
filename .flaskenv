# This file stores environment variables for the Flask CLI.
# Flask automatically loads this file when you run `flask` commands.

FLASK_APP=manage.py
FLASK_DEBUG=1

# Generate a real secret key for production. You can generate one in python:
# python -c "import os; print(os.urandom(24).hex())"
SECRET_KEY='a-very-secret-and-long-random-string-for-security'