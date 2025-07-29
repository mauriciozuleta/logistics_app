from flask import Blueprint

coredata = Blueprint("coredata", __name__, template_folder="templates/coredata")
from . import routes