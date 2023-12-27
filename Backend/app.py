from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from PIL import Image
from io import BytesIO
from flask_cors import CORS
import pymysql
import io
import base64
import sys
from flask_cors import cross_origin

from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
from base64 import b64encode, b64decode
from datetime import datetime
import os
import json

app = Flask(__name__)
CORS(app)  

# Connect to the MySQL database

#db = pymysql.connect(host = 'localhost', port = 3306, user = 'root', password = 'password', database = 'major_project_db')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg'}  # Define the allowed image file extensions

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_valid_image(file_bytes):
    try:
        Image.open(io.BytesIO(file_bytes))
        return True
    except Exception as e:
        return False
    

@app.route("/AESencryptFile", methods=["POST"])
@cross_origin()
def aes_encrypt ():

    key_file_content = request.form['keyFileContent']
    files = request.files.getlist('file')
    print(f"files : {files}")
    key = key_file_content.encode('utf-8')
    encrypted_files = []
    print(key)
    for file in files:
        filename = secure_filename(file.filename)
        file_content = file.read()

        # Encrypt file content using AES-GCM
        cipher = AES.new(key, AES.MODE_GCM)
        #cipher.update(b"additional_data")  # Additional authenticated data if needed

        ciphertext, tag = cipher.encrypt_and_digest(file_content)
        print("ciphertext")
        print (ciphertext)
        print("tag")
        print(tag)
        # Prepare encrypted file data
        encrypted_data = b64encode(cipher.nonce + tag + ciphertext).decode('utf-8')


        encrypted_files.append({'filename': filename, 'encrypted_data': encrypted_data})
        print ( encrypted_files)
    #print (jsonify({'encrypted_files': encrypted_files}))

    return jsonify({'encrypted_files': encrypted_files})



if __name__ == '__main__':
    
    app.run("localhost", 6969, debug=True)
