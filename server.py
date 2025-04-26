from flask import Flask, render_template, request, redirect, url_for, abort
import json
import os

app = Flask(__name__)

# Load quizzes once
with open(os.path.join("data", "quizzes.json")) as f:
    quizzes_data = json.load(f)["quizzes"]

with open(os.path.join("data", "content.json")) as f:
    content_data = json.load(f)["content"]

def get_lesson_content(lesson_id):
    """Helper function to get lesson content and its children"""
    lesson = next((item for item in content_data if item["id"] == lesson_id), None)
    if not lesson:
        return None

    slides = []

    # For menu types, get all children
    if lesson.get("type") == "menu" and "children" in lesson:
        for child in lesson["children"]:
            child_content = next((item for item in content_data if item["id"] == child["id"]), None)
            if child_content:
                slides.append(child_content)
    # For content and quiz types, use the item itself
    elif lesson.get("type") in ["content", "quiz"]:
        slides.append(lesson)

    return {
        "slides": slides,
        "title": lesson.get("title", "Lesson"),
        "type": lesson.get("type")
    }
@app.route('/')
def home():
    return render_template('outline.html')

@app.route('/sorting')
def sorting():
    return render_template('sorting.html')

@app.route('/wash-settings')
def wash_settings():
    return render_template('wash-settings.html')
@app.route('/reading-labels')
def reading_labels():
    return render_template('index.html')


@app.route("/quiz/<quiz_id>", methods=["GET", "POST"])
def quiz_page(quiz_id):
    quiz = next((q for q in quizzes_data if q["id"] == quiz_id), None)
    if not quiz:
        return "Quiz not found", 404

    score = None
    show_score = False
    if request.method == "POST":
        show_score = True
        # Only proceed if the quiz has questions
        if "questions" in quiz:
            questions = quiz["questions"][:3]
            correct_answers = [q["answer"] for q in questions]
            user_answers = [request.form.get(f"q{i}") for i in range(len(questions))]

            score = 0
            for u, c in zip(user_answers, correct_answers):
                if u is None:
                    continue
                if isinstance(c, list):
                    if u in c:
                        score += 1
                else:
                    if u == c:
                        score += 1

    return render_template("quiz.html", quiz=quiz, score=score, show_score = show_score)


@app.route('/lesson/<lesson_id>')
def dynamic_lesson(lesson_id):
    with open('data/content.json') as f:
        catalog = json.load(f)['content']

    # Find the requested lesson
    lesson = next((item for item in catalog if item['id'] == lesson_id), None)
    if not lesson:
        abort(404)

    # If it's a menu with children, we'll render it differently
    if lesson.get('type') == 'menu' and 'children' in lesson:
        return render_template(
            "menu.html",  # We'll create this template
            lesson=lesson,
            lesson_title=lesson['title']
        )

    # For regular content and quizzes
    slides = [lesson]
    correct_answers = []

    if lesson.get('type') == 'quiz':
        correct_answers = [opt['text'] for opt in lesson['options'] if opt['correct']]

    return render_template(
        "index.html",
        content=slides,
        correct_answers=correct_answers,
        lesson_title=lesson['title']
    )

if __name__ == '__main__':
    app.run(debug=True, port=5001)