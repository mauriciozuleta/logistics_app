from flask import Blueprint

financial = Blueprint("financial", __name__, template_folder="templates/financial")
from . import routes