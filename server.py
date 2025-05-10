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
        "progress": [],  # stores visited slide/content IDs
        "completed": 1  # stores completed quiz IDs
    }
}

username = "user1"

@app.route('/')
def home():
    return redirect(url_for('dynamic_page', page_id='mainpage'+str(users[username]["completed"])))
    
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
        user["completed"] = max(user["completed"], i)
        chapters = [["Sorting", "/page/sorting-mainpage2"], ["Wash settings", "/page/wash-settings-mainpage"], ["Reading labels", "/page/reading-labels-mainpage"], ["Final Quiz", "/page/final-quiz"]]
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
        slides = [content_data[child] for child in page['children'] if child in content_data]
        print("Requested page:", page_id)
        print("Slides loaded:", [s['id'] for s in slides])
        return render_template("lesson.html", lesson=page, content=slides, nextpage=page['next_page'])

    else:
        # standalone content pages (no children)
        print("Requested single content page:", page_id)
        return render_template("lesson.html", lesson=page, content=[page], nextpage=page['next_page'])
    

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

@app.route("/reset-progress", methods=["POST"])
def reset_progress():
    users["user1"]["completed"] = 1
    users["user1"]["progress"] = []
    return jsonify({"status": "success", "message": "Progress reset"})


if __name__ == '__main__':
    app.run(debug=True, port=5001)