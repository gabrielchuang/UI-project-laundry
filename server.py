from flask import Flask, render_template, Response, request, jsonify, redirect, abort
import json

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('home.html')

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