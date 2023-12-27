from app import app

from flask import session ,send_file
import io
import zipfile

from flask import jsonify, request ,make_response
from werkzeug.utils import secure_filename
from flask_cors import cross_origin

from datetime import datetime
import json


from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
from base64 import b64encode, b64decode
from datetime import datetime
import os
import json

def format_size(size_in_bytes):
    size_in_bytes = float(size_in_bytes)
    kilo = 1024
    mega = kilo * kilo
    giga = mega * kilo

    if size_in_bytes >= giga:
        size = '{:.2f} GB'.format(size_in_bytes / giga)
    elif size_in_bytes >= mega:
        size = '{:.2f} MB'.format(size_in_bytes / mega)
    elif size_in_bytes >= kilo:
        size = '{:.2f} KB'.format(size_in_bytes / kilo)
    else:
        size = '{:.2f} bytes'.format(size_in_bytes)

    return size

def format_date():
    now = datetime.now()

    # Format the date and time 
    formatted_date = now.strftime("%d:%m:%Y %I:%M:%S %p")

    return formatted_date

@app.route("/AESencryptFile", methods=["POST"])
@cross_origin()
def aes_encrypt ():

    key_file_content = request.form['keyFileContent']
    files = request.files.getlist('file')
    files_array = []
    for file in files:
        files_array.append(file.filename)
    print(f'file array:{files_array}')
    print(f"files : {files}")
    print(files)
    key = key_file_content.encode('utf-8')
    encrypted_files = []
    for file in files:
        filename = secure_filename(file.filename)
        file_content = file.read()

        # Encrypt file content using AES-GCM
        cipher = AES.new(key, AES.MODE_GCM)
        #cipher.update(b"additional_data")  # Additional authenticated data if needed

        ciphertext, tag = cipher.encrypt_and_digest(file_content)

        # Prepare encrypted file data
        encrypted_data = b64encode(cipher.nonce + tag + ciphertext).decode('utf-8')

        encrypted_files.append({'filename': filename, 'encrypted_data': encrypted_data})


    return jsonify({'encrypted_files': encrypted_files})



