from flask import Flask, render_template, request, redirect, url_for, abort
import json
import os

app = Flask(__name__)

# Load quizzes once
with open(os.path.join("data", "quizzes.json")) as f:
    quizzes_data = json.load(f)["quizzes"]

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
    return render_template('reading_labels.html')

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

@app.route('/lesson/<int:lesson_num>')
def lesson(lesson_num):
    with open('data/content.json') as f:
        catalog = json.load(f)['content']

    lesson_map = {
        1: 'sorting-mainpage',
        # TODO
        # 2: 'wash-settings-mainpage',
        # ...
    }
    parent_id = lesson_map.get(lesson_num)
    if not parent_id:
        abort(404)

    parent = next((i for i in catalog if i['id'] == parent_id), None)
    if not parent:
        abort(404)

    section_id = request.args.get('section')
    if section_id:
        node = next((i for i in catalog if i['id'] == section_id), None)
        if not node or node.get('type') != 'menu':
            abort(404)
        return render_template(
          'lessons/sorting/section1.html',
          parent=parent,
          lesson=node,
          lesson_num=lesson_num
        )

    return render_template(
      'lessons/sorting/index.html',
      lesson=parent,
      lesson_num=lesson_num
    )


if __name__ == '__main__':
    app.run(debug=True, port=5001)