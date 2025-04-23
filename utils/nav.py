import json

# Load once (or cache later)
with open('data/order.json') as f:
    order = json.load(f)

def flatten_order(node, parent=None):
    """
    Flattens nested structure into a sequence of (page_id, parent_id).
    """
    sequence = []

    if isinstance(node, dict):
        current_id = node["id"]
        elements = node["elements"]
        for el in elements:
            if isinstance(el, dict):
                sequence += flatten_order(el, current_id)
            else:
                clean_id = el.strip() if isinstance(el, str) else el
                sequence.append((clean_id, current_id))
        sequence.insert(0, (current_id, parent))
    else:
        sequence.append((node, parent))

    return sequence


with open('data/content.json') as f:
    content = json.load(f)
with open('data/quizzes.json') as f:
    quizzes = json.load(f)

content_types = {item['id']: item['type'] for item in content['content']}
quiz_types = {quiz['id']: quiz['type'] for quiz in quizzes['quizzes']}

def get_item_type(page_id):
    if page_id in content_types:
        return 'page'
    elif page_id in quiz_types:
        return 'quiz'
    else:
        return None


flat_sequence = flatten_order(order)
print(flat_sequence)

# Create a lookup by page id
page_index = {page_id: idx for idx, (page_id, _) in enumerate(flat_sequence)}

def get_next_page(current_id):
    idx = page_index.get(current_id)
    if idx is None:
        return None, None

    if idx + 1 < len(flat_sequence):
        next_id = flat_sequence[idx + 1][0]
        return next_id, get_item_type(next_id)
    else:
        parent_id = get_parent_page(current_id)
        return parent_id, get_item_type(parent_id)


def get_parent_page(current_id):
    for pid, parent in flat_sequence:
        if pid == current_id:
            return parent
    return None
