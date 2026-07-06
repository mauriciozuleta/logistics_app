"""
Version information for the Logistics Application
"""

__version__ = "1.0.0"
__app_name__ = "Logistics Management System"
__build_date__ = "2025-11-23"

def get_version_info():
    """Returns version information as a dictionary"""
    return {
        "version": __version__,
        "app_name": __app_name__,
        "build_date": __build_date__
    }