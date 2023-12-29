from flask import Flask, render_template, request, jsonify, Response
from werkzeug.utils import secure_filename
from flask_cors import cross_origin
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
from base64 import b64encode, b64decode
from datetime import datetime
from PIL import Image
from io import BytesIO
from flask_cors import CORS
import pymysql
import io
import base64
import sys
import requests
import zipfile
import hashlib
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

def format_date():
    now = datetime.now()

    # Format the date and time
    formatted_date = now.strftime("%d:%m:%Y %I:%M:%S %p")

    return formatted_date
    
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

@app.route('/set_key', methods=['POST'])
def set_key():
    global key  
    data = request.get_json()
    qr_content = data.get('qrContent', '')
    key = bytes.fromhex(qr_content) 

    try:
        if len(key) != 32:
            raise ValueError("Key must be 32 bytes long")

        return jsonify(message="Key Set Successfully")
    except ValueError as e:
        return jsonify(error='Invalid QR Code Content', message=str(e)), 400

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



def virustotal_scan(hash_value):
    API_KEY = '495d37149054ebae8de04fbf1e19b8f41987188a818d9df9ef7fa775c61ad4e8'
    url = f'https://www.virustotal.com/api/v3/files/{hash_value}'
    headers = {'x-apikey': API_KEY}

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        json_response = response.json()
        if 'data' in json_response and 'attributes' in json_response['data']:
            attributes = json_response['data']['attributes']
            last_analysis_stats = attributes.get('last_analysis_stats', {})
            if 'malicious' in last_analysis_stats:
                malicious_count = last_analysis_stats['malicious']
                if malicious_count > 0:
                    print(f"The file with hash {hash_value} is malicious. Detected by {malicious_count} antivirus engines.")
                    return 'malicious'
                else:
                    print(f"The file with hash {hash_value} is not detected as malicious by any antivirus engine.")
                    return 'non-malicious'
            else:
                print("Malicious information not available.")
        else:
            print("Invalid response format.")
    elif response.status_code == 404:
        print(f"The file with hash {hash_value} is not found on VirusTotal.")
    else:
        print(f"Error: {response.status_code}, {response.text}")


def virustotal_scan(hash_value):
    API_KEY = '495d37149054ebae8de04fbf1e19b8f41987188a818d9df9ef7fa775c61ad4e8'
    url = f'https://www.virustotal.com/api/v3/files/{hash_value}'
    headers = {'x-apikey': API_KEY}

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        json_response = response.json()
        if 'data' in json_response and 'attributes' in json_response['data']:
            attributes = json_response['data']['attributes']
            last_analysis_stats = attributes.get('last_analysis_stats', {})
            if 'malicious' in last_analysis_stats:
                malicious_count = last_analysis_stats['malicious']
                if malicious_count > 0:
                    print(f"The file with hash {hash_value} is malicious. Detected by {malicious_count} antivirus engines.")
                    return 'malicious'
                else:
                    print(f"The file with hash {hash_value} is not detected as malicious by any antivirus engine.")
                    return 'non-malicious'
            else:
                print("Malicious information not available.")
        else:
            print("Invalid response format.")
    elif response.status_code == 404:
        print(f"The file with hash {hash_value} is not found on VirusTotal.")
    else:
        print(f"Error: {response.status_code}, {response.text}")

@app.route('/upload_file', methods=['POST'])
def upload_file():
    try:
        uploaded_file = request.files['file']
        
        with uploaded_file.stream as f:
            filebinary = f.read()

        hash_object = hashlib.sha256(filebinary)
        hash_value = hash_object.hexdigest()

        result = virustotal_scan(hash_value)

        if result == 'malicious':
            print(f"The file {uploaded_file.filename} is malicious. Upload denied.")
            return {"isValid": False, "message": "Malicious file. Upload denied."}

        print(f"Received file: {uploaded_file.filename}")

        return {"isValid": True}

    except Exception as e:
        print("Error processing File:", str(e))
        return {"isValid": False, "error": str(e)}

@app.route('/encrypt', methods=['POST'])
def encrypt_files():
    try:
        uploaded_files = request.files.getlist('files')
        
        # Create a BytesIO object to store the ZIP file in memory
        encrypted_zip = BytesIO()

        with zipfile.ZipFile(encrypted_zip, 'a', zipfile.ZIP_DEFLATED, allowZip64=True) as zipf:
            for uploaded_file in uploaded_files:
                key = get_random_bytes(32)
                nonce = get_random_bytes(12)

                file_size_bytes = uploaded_file.content_length
                formatted_size = format_size(file_size_bytes)
                header = f'{format_date()} {formatted_size}'
                header_bytes = header.encode('utf-8')

                filename = uploaded_file.filename
                file_name, file_extension = filename.rsplit('.', 1)
                file_extension_str = file_extension.encode('utf-8')
                file_extension_padded = pad(file_extension_str, 16)

                file_data = uploaded_file.read()
                file_data = file_extension_padded + file_data

                aes_gcm = AES.new(key, AES.MODE_GCM, nonce=nonce)
                aes_gcm.update(header_bytes)
                ciphertext, tag = aes_gcm.encrypt_and_digest(file_data)

                header_bytes_padded = pad(header_bytes, 48)
                ciphertext_padded = pad(ciphertext, 16)

                concat = header_bytes_padded + nonce + ciphertext_padded + tag

                new_file_name = f'{file_name}.enc'

                # Write the new file to the existing ZIP file
                zipf.writestr(new_file_name, concat)

        # Move the buffer position to the beginning before sending
        encrypted_zip.seek(0)

        response = Response(encrypted_zip.read(), content_type='application/zip')
        response.headers['Content-Disposition'] = f'attachment; filename="encrypted_files.zip"'
        return response

    except Exception as e:
        print("Error processing Files:", str(e))
        return {"isValid": False, "error": str(e)}

@app.route('/aes_keygen', methods=['POST'])
def aes_keygen():
    try:
        data = request.json
        key_name = data.get('keyName')

        generated_key = get_random_bytes(32)
        hex_key = generated_key.hex()

        return jsonify({'key': hex_key})
    except Exception as e:
        print("Error generating key: ", str(e))
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True,
    port=5000)
