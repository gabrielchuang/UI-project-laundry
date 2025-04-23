from flask import Flask, render_template, request, redirect, url_for
import json
import os

app = Flask(__name__)

# Load quizzes once
with open(os.path.join("data", "quizzes.json")) as f:
    quizzes_data = json.load(f)["quizzes"]

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/sorting')
def sorting():
    return render_template('sorting.html')

@app.route('/wash-settings')
def wash_settings():
    return render_template('wash_settings.html')

@app.route('/reading-labels')
def reading_labels():
    return render_template('reading_labels.html')

@app.route("/quiz/<quiz_id>", methods=["GET", "POST"])
def quiz_page(quiz_id):
    quiz = next((q for q in quizzes_data if q["id"] == quiz_id), None)
    if not quiz:
        return "Quiz not found", 404

    score = None
    if request.method == "POST":
        # Get the first three questions
        questions = quiz["questions"][:3]
        correct_answers = [q["answer"] for q in questions]
        
        # Get user answers
        user_answers = [request.form.get(f"q{i}") for i in range(len(questions))]
        
        # Calculate score
        score = sum(u == c for u, c in zip(user_answers, correct_answers) if u is not None)
        
        # Render the template with the score
        return render_template("quiz.html", quiz=quiz, score=score)

    # On GET request, render the quiz without a score
    return render_template("quiz.html", quiz=quiz, score=None)

if __name__ == '__main__':
    app.run(debug=True, port=5001)