from flask import Flask, render_template, request, redirect, url_for, abort
import json
import os

app = Flask(__name__)

# Load quizzes once
with open(os.path.join("data", "quizzes.json")) as f:
    quizzes_data = json.load(f)["quizzes"]

with open(os.path.join("data", "content.json")) as f:
    content_data = json.load(f)["content"]
    content_data = {x["id"]: x for x in content_data}


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
    assert False, "shouldn't be using this function...?"
    return render_template('index.html', lesson=z)


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


@app.route('/page/<page_id>')
def dynamic_page(page_id):
    with open('data/content.json') as f:
        catalog = json.load(f)['content']

    # Find the requested lesson
    page = content_data[page_id]
    if not page:
        abort(404)

    print(page["type"])

    # If it's a menu with children, we'll render it differently
    if page.get('type') == 'menu':
        menu = page
        return render_template(
            "menu.html",  # We'll create this template
            menu=menu
        )

    elif page["type"] == "lesson": 
        lesson = page
        # For regular content and quizzes
        slides = [content_data[child["id"]] for child in lesson['children']]
        print(slides)
        return render_template(
            "lesson2.html",
            lesson=lesson, 
            content=slides,
            slides=slides
        )
    else: 
        print(lesson["type"])
        correct_answers = []

        if lesson.get('type') == 'quiz':
            correct_answers = [opt['text'] for opt in lesson['options'] if opt['correct']]

        print(slides, correct_answers, lesson['title'])

        return render_template(
            "index.html",
            content=slides,
            correct_answers=correct_answers,
            lesson_title=lesson['title']
        )

if __name__ == '__main__':
    app.run(debug=True, port=5001)