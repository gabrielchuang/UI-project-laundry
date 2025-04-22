from flask import Flask, render_template, Response, request, jsonify, redirect

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('home.html')


if __name__ == '__main__':
    app.run(debug=True, port=5001)