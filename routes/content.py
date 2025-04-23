from flask import Blueprint, render_template
import json
from utils.nav import get_next_page, get_parent_page

bp = Blueprint('content', __name__)

with open('data/content.json') as f:
    content_data = json.load(f)

@bp.route('/page/<page_id>')
def render_page(page_id):

    page = next((item for item in content_data['content'] if item['id'] == page_id), None)
    if not page:
        return "Page not found", 404

    template = f"{page['type']}.html"

    next_id, next_type = get_next_page(page_id)
    if not next_id:
        next_id = get_parent_page(page_id)

    return render_template(template, page=page, next_id=next_id, next_type=next_type)
