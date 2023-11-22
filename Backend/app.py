from flask import Flask, render_template

app = Flask(__name__)

app.config['DEBUG'] = True

@app.route('/')
def login():
    return render_template('login.html')

if __name__ == '__main__':
    app.run()

    print("hello")