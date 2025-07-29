from flask import Blueprint

ops = Blueprint("ops", __name__, template_folder="templates")
from . import routes