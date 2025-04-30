from flask import Flask, render_template, request, redirect, url_for, abort, jsonify
from datetime import datetime
import json
import os

app = Flask(__name__)

# Load quizzes once
with open(os.path.join("data", "quizzes.json")) as f:
    quizzes_data = json.load(f)["quizzes"]

with open(os.path.join("data", "content.json")) as f:
    content_data = json.load(f)["content"]
    content_data = {x["id"]: x for x in content_data}


# TODO: Gervais - work on minimal auth process; hardcoded the user now
users = {
    "user1": {
        "name": "Joe Doe",
        "progress": []  # stores visited slide/content IDs
    }
}


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

    elif 'children' in page and page['children']:
        # lessons with children
        slides = [content_data[child['id']] for child in page['children'] if child['id'] in content_data]
        print("Requested page:", page_id)
        print("Slides loaded:", [s['id'] for s in slides])
        return render_template("lesson2.html", lesson=page, content=slides)

    else:
        # standalone content pages (no children)
        print("Requested single content page:", page_id)
        return render_template("lesson2.html", lesson=page, content=[page])



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

    # Always use single-question format
    quiz['display_mode'] = 'single_question'

    if request.method == 'POST':
        score = 0
        user_answers = {}

        # Debug information
        print("Form data received:", request.form)

        if 'questions' in quiz:
            for i, question in enumerate(quiz['questions']):
                question_key = f'q{i}'
                user_answer = request.form.get(question_key)
                user_answers[i] = user_answer

                print(f"Question {i + 1}: User answer: '{user_answer}', Correct answer: '{question['answer']}'")

                if user_answer == question['answer']:
                    score += 1
        else:
            # Handle single question format
            user_answer = request.form.get('q0')
            user_answers[0] = user_answer
            correct_answer = quiz.get('answer')

            print(f"Single question: User answer: '{user_answer}', Correct answer: '{correct_answer}'")

            if user_answer == correct_answer:
                score = 1

        # Calculate total questions for percentage
        total_questions = len(quiz.get('questions', [1]))  # Default to 1 for single question

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
                               percentage=percentage,
                               user_answers=user_answers,
                               feedback=feedback)

    return render_template('quiz.html', quiz=quiz)

@app.route('/save-progress', methods=['POST'])
def save_progress():
    data = request.get_json()
    slide_id = data.get("id")

    if not slide_id:
        return jsonify({"error": "Missing slide ID"}), 400

    user = users["user1"]  # TODO: make dynamic later

    if "progress" not in user:
        user["progress"] = []

    current_time = datetime.now()
    time_spent = 0
    if user["progress"]:
        last_slide = user["progress"][-1]
        last_time = last_slide["timestamp"]
        time_spent = (current_time - last_time).total_seconds()
        print(f"Time spent on slide {last_slide['slideId']}: {time_spent:.2f} seconds")
    else:
        print("First slide being saved.")

    already_recorded = any(entry["slideId"] == slide_id for entry in user["progress"])

    if not already_recorded:
        user["progress"].append({
            "slideId": slide_id,
            "timestamp": current_time
        })
        print(f"Logged slide {slide_id} at {current_time}")

    print(time_spent)

    return jsonify({
        "status": "success",
        "completed": slide_id,
        "timeSpent": time_spent
    })

@app.route('/get_progress', methods=['GET'])
def get_progress():
    user_id = request.args.get('user_id')
    user = users.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    serialized = [
        {"slideId": p["slideId"], "timestamp": p["timestamp"].isoformat()}
        for p in user["progress"]
    ]

    return jsonify({
        "user": user_id,
        "progress": serialized
    })


if __name__ == '__main__':
    app.run(debug=True, port=5001)