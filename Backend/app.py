from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from PIL import Image
from io import BytesIO
from flask_cors import CORS
import pymysql
import io
import base64
import sys

app = Flask(__name__)
CORS(app)  

# Connect to the MySQL database

db = pymysql.connect(host = 'localhost', port = 3306, user = 'root', password = 'password', database = 'major_project_db')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg'}  # Define the allowed image file extensions

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_valid_image(file_bytes):
    try:
        Image.open(io.BytesIO(file_bytes))
        return True
    except Exception as e:
        return False
    
@app.route('/upload', methods=['POST'])
def upload():
    username = request.form.get('name')
    uploaded_file = request.files.get('profile-picture')
    email = request.form.get('email')

    print(uploaded_file, username)

    if uploaded_file is None and username is not None:
        try:
            # Proceed with the database update for username only
            sql = "UPDATE user_account SET username = %s WHERE email_address = %s"
            with db.cursor() as cursor:
                cursor.execute(sql, (username, email))
            db.commit()
            return jsonify({'message': 'Username updated successfully'})
        except Exception as e:
            db.rollback()
            return jsonify({'error': str(e)})

    if uploaded_file is None:
        return jsonify({'message': 'No changes'})

    if uploaded_file.filename == '':
        return jsonify({'error': 'No selected file'})
    
    if not allowed_file(uploaded_file.filename):
        return jsonify({'error': 'Invalid file type. Only image files are allowed.'})

    # Read the contents of the file as bytes
    file_bytes = uploaded_file.read()

    # Check if the file is a valid image
    if not is_valid_image(file_bytes):
        return jsonify({'error': 'Invalid image file'})
    
    try:
        # Proceed with the database update for both username and profile picture
        sql = "UPDATE user_account SET username = %s, profile_picture = %s WHERE email_address = %s"
        with db.cursor() as cursor:
            cursor.execute(sql, (username, file_bytes, email))
        db.commit()
        return jsonify({'message': 'File uploaded successfully'})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
