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
    return redirect(url_for('dynamic_page', page_id='mainpage1'))
    
@app.route('/page/<page_id>')
def dynamic_page(page_id):
    user = users.get("user1")  # TODO: Gervais - replace with actual user session
    # clearing prev timestamp on new page
    if "progress" in user and user["progress"]:
        last_slide = user["progress"][-1]
        print(f"Resetting timestamp on last slide: {last_slide['slideId']}")
        last_slide["timestamp"] = datetime.now()

    if page_id[:8] == 'mainpage':
        i = int(page_id[8:])
        chapters = [["Sorting", "/page/sorting-mainpage"], ["Wash settings", "/page/wash-settings-mainpage"], ["Reading labels", "/page/reading-labels-mainpage"], ["Final Quiz", "/page/final-quiz"]]
        chapters = [{"name": c[0], "page": c[1]} for c in chapters]
        return render_template("outline.html", content=content_data.values(), iter=i, chapters=chapters)

    page = content_data.get(page_id)
    if not page:
        abort(404)


    print("pagetttt:"+page['type'])
    if page['type'] == 'menu':
        return render_template("menu.html", menu=page)

    elif page['type'] == 'quiz':
        return redirect(url_for('quiz_page', quiz_id=page_id))

    elif 'children' in page and page['children']:
        # lessons with children
        slides = [content_data[child['id']] for child in page['children'] if child['id'] in content_data]
        print("Requested page:", page_id)
        print("Slides loaded:", [s['id'] for s in slides])
        return render_template("lesson.html", lesson=page, content=slides)

    else:
        # standalone content pages (no children)
        print("Requested single content page:", page_id)
        return render_template("lesson.html", lesson=page, content=[page])
    
@app.route('/quiz/<quiz_id>', methods=['GET', 'POST'])
def quiz_page(quiz_id):
    # Find the quiz from content_data["content"]
    quiz = content_data.get(quiz_id)

    if not quiz or quiz.get('type') != 'quiz':
        abort(404)

    # Set default parent_id if not present
    quiz.setdefault('parent_id', 'mainpage')

    # Always use single-question format in UI
    quiz['display_mode'] = 'single_question'

    # Normalize quizzes that use "question" instead of "questions"
    if "questions" not in quiz and "question" in quiz:
        quiz["questions"] = [quiz]

    questions = quiz.get("questions", [])
    total_questions = len(questions) or 1

    if request.method == 'POST':
        score = 0
        user_answers = {}

        print("Form data received:", request.form)

        for i, question in enumerate(questions):
            q_type = question.get("type")

            if q_type == 'wash_panel':
                # Extract and clean options
                cycle = request.form.get(f'selected-cycle-{i}')
                spin = request.form.get(f'selected-spin-{i}')
                temp = request.form.get(f'selected-temp-{i}')
                user_answer = {"cycle": cycle, "temperature": temp, "spin": spin} if cycle and temp and spin else None

                correct = question['answer']

                def match(val, correct_val):
                    return val in correct_val if isinstance(correct_val, list) else val == correct_val

                if user_answer and all([
                    match(user_answer['cycle'], correct['cycle']),
                    match(user_answer['temperature'], correct['temperature']),
                    match(user_answer['spin'], correct['spin'])
                ]):
                    score += 1

                print(f"Wash panel {i} -> User: {user_answer} | Correct: {correct}")

            elif q_type == 'drag_and_drop':
                bin_assignments = {}
                for item in question['items']:
                    item_id = item['id']
                    bin_val = request.form.get(f'drag_result_{item_id}')
                    if bin_val:
                        bin_assignments.setdefault(bin_val, []).append(item_id)

                user_groups = [sorted(v) for v in bin_assignments.values()]
                correct_groups = [sorted(v) for v in question.get('answer', {}).values()]

                user_groups.sort()
                correct_groups.sort()

                user_answer = bin_assignments

                if user_groups == correct_groups:
                    score += 1

                print(f"Drag & Drop {i} -> User groups: {user_groups} | Correct groups: {correct_groups}")


            else:
                # Handle multiple choice or single answer questions
                user_answer = request.form.get(f'q{i}')
                correct = question.get("answer")

                if user_answer == correct:
                    score += 1

                print(f"Question {i + 1}: User answer: '{user_answer}', Correct: '{correct}'")

            user_answers[i] = user_answer

        percentage = (score / total_questions) * 100

        if percentage == 100:
            feedback = "Perfect score! You've mastered this topic."
        elif percentage >= 80:
            feedback = "Great job! You understand most of the concepts."
        elif percentage >= 60:
            feedback = "Good effort! Review the incorrect answers to improve."
        else:
            feedback = "Keep practicing! Review the lesson and try again."

        print(f"Final score: {score}/{total_questions}")
        print(f"User answers: {user_answers}")

        return render_template('quiz-result.html',
                               quiz=quiz,
                               score=score,
                               total=total_questions,
                               percentage=percentage,
                               user_answers=user_answers,
                               feedback=feedback)

    return render_template('quiz.html', quiz=quiz)


# TODO: Gervais - to make timing persistent on refresh and maintain it on UI progress sidebar
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
        if last_time:
            time_spent = (current_time - last_time).total_seconds()
            print(f"Time spent on slide {last_slide['slideId']}: {time_spent:.2f} seconds")
        else:
            print("No valid timestamp for previous slide (likely due to refresh).")
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