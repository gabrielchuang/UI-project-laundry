from flask import Blueprint, render_template, request
import json
from utils.nav import get_next_page, get_item_type

bp = Blueprint('quizzes', __name__)

with open('data/quizzes.json') as f:
    quizzes_data = json.load(f)

@bp.route('/quiz/<quiz_id>', methods=['GET', 'POST'])
def render_quiz(quiz_id):
    quiz = next((q for q in quizzes_data['quizzes'] if q['id'] == quiz_id), None)
    if not quiz:
        return "Quiz not found", 404

    feedback = None
    correct = False

    if request.method == 'POST':
        user_answer = request.form.get('answer')
        correct = user_answer == quiz['answer']
        feedback = "✅ Correct!" if correct else "❌ Not quite. Try again."

    next_id, next_type = get_next_page(quiz_id)

    return render_template(
        f"quiz_{quiz['quiz-type']}.html",
        quiz=quiz,
        feedback=feedback,
        correct=correct,
        next_id=next_id,
        next_type=next_type
    )