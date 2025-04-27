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
    return redirect(url_for('dynamic_page', page_id='mainpage'))


@app.route('/page/<page_id>')
def dynamic_page(page_id):
    page = content_data.get(page_id)
    if not page:
        abort(404)

    if page['type'] == 'menu':
        return render_template("menu.html", menu=page)
    elif page['type'] == 'quiz':
        return redirect(url_for('quiz_page', quiz_id=page_id))
    else:
        # Handle lessons/content normally
        slides = [content_data[child['id']] for child in page.get('children', [])]
        return render_template("lesson2.html", lesson=page, content=slides)


@app.route('/quiz/<quiz_id>', methods=['GET', 'POST'])
def quiz_page(quiz_id):
    # Find quiz in quizzes_data first
    quiz = next((q for q in quizzes_data if q["id"] == quiz_id), None)

    # If not found, check content_data
    if not quiz:
        quiz = content_data.get(quiz_id)
        if not quiz or quiz['type'] != 'quiz':
            abort(404)

    # Set default parent_id if not specified
    if 'parent_id' not in quiz:
        quiz['parent_id'] = 'mainpage'

    if request.method == 'POST':
        score = 0
        user_answers = {}
        total_questions = 0

        # Handle both quiz structures
        if 'questions' in quiz:
            questions = quiz['questions']
            total_questions = len(questions)
            for i, question in enumerate(questions):
                user_answer = request.form.get(f'q{i}')
                user_answers[i] = user_answer
                if user_answer == question['answer']:
                    score += 1
        else:
            # Single question format
            total_questions = 1
            user_answer = request.form.get('q0')
            user_answers[0] = user_answer
            if user_answer == quiz['answer']:
                score = 1

        # Generate feedback
        percentage = (score / total_questions) * 100
        if percentage == 100:
            feedback = "Perfect score! You've mastered this topic."
        elif percentage >= 80:
            feedback = "Great job! You understand most of the concepts."
        elif percentage >= 60:
            feedback = "Good effort! Review the incorrect answers to improve."
        else:
            feedback = "Keep practicing! Review the lesson and try again."

        return render_template('quiz-result.html',
                               quiz=quiz,
                               score=score,
                               total=total_questions,
                               user_answers=user_answers,
                               feedback=feedback)

    return render_template('quiz.html', quiz=quiz)

if __name__ == '__main__':
    app.run(debug=True, port=5001)