from flask import Flask
from app import homepage, webmap, visualization, report


app = Flask(__name__)

# Register blueprints
app.register_blueprint(homepage.bp)
app.register_blueprint(webmap.bp)
app.register_blueprint(visualization.bp)
app.register_blueprint(report.bp)
