from flask import Flask
from routes.content import bp as content_bp
from routes.quizzes import bp as quizzes_bp

app = Flask(__name__)

# Register blueprints
app.register_blueprint(content_bp)
app.register_blueprint(quizzes_bp)

# Home route (you can customize this to load from your JSON)
@app.route('/')
def home():
    return '<h1>Welcome to the Laundry Learning site!</h1><p><a href="/page/mainpage">Start Course</a></p>'

if __name__ == '__main__':
    app.run(debug=True)
