from __future__ import print_function
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, Response, abort
from werkzeug.utils import secure_filename
from flask_cors import cross_origin
from Crypto.Cipher import AES
from datetime import datetime, timedelta
from dbutils.pooled_db import PooledDB
from Crypto.Random import get_random_bytes
from sib_api_v3_sdk.rest import ApiException
from pprint import pprint
from Crypto.Util.Padding import pad, unpad
from base64 import b64encode, b64decode
from datetime import datetime, timezone
from PIL import Image, ImageDraw
from io import BytesIO
from flask_cors import CORS
import pymysql
import io
import base64
import sys
import requests
import zipfile
import hashlib
import jwt
import os
import json
import pyotp
import threading
import qrcode
import secrets
import time
import schedule
import sib_api_v3_sdk
import requests
import numpy as np 
from io import BytesIO
import logging

app = Flask(__name__)
# cors_config = {
#     "origins": ["http://localhost:3000","http://localhost:5000" ],
#     "methods": ["GET", "POST", "PUT", "DELETE"],
    
# }
#CORS(app,resources={r"*": cors_config})
CORS(app)
load_dotenv()

MYSQL_HOST = os.getenv('MYSQL_HOST')
MYSQL_PORT = int(os.getenv('MYSQL_PORT'))
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE')

pool = PooledDB(
    creator=pymysql,  # Database library/module
    maxconnections=None,  # Maximum number of connections in the pool
    host=MYSQL_HOST,
    port=MYSQL_PORT,
    user=MYSQL_USER,
    password=MYSQL_PASSWORD,
    database=MYSQL_DATABASE
)

user_dicts = {}  # Dictionary to store user-specific dictionaries
user_secrets = {}
fp_dicts = {}
da_dicts = {}
dtfa_dicts = {}
ev_dicts = {}
# salt = secrets.token_hex(16)
SECRET_KEY = get_random_bytes(32)
SECRET_KEY2 = get_random_bytes(32)
SECRET_KEYFP = get_random_bytes(32)
IV = get_random_bytes(16)
IV2 =get_random_bytes(16)
IVFP = get_random_bytes(16)

def getAccountIdFromCookie(authorization_header):
    response = requests.get('http://localhost:3000/get-account-id', headers={'Authorization': authorization_header})
    if response.status_code == 200:
        account_id = response.json()['accountId']
        print(account_id)
        return account_id
    else:
        print('Error:', response.json()['error'])

def getEmailAddressById(id, authorization_header):
    # Make a POST request to the endpoint
    response = requests.post(
        'http://localhost:3000/get-email-by-id',
        json={'id': id},
        headers={'Authorization': authorization_header}
    )

    # Check the response status code and handle accordingly
    if response.status_code == 200:
        email = response.json()['email']
        print(email)
        return email
    elif response.status_code == 401:
        print('Unauthorized')
    else:
        print('Error:', response.json()['error'])

def fetch_latest_keys():
    try:
        # Make a POST request with the password
        password = '513e2bb4e26ad8a2f1bcf51bb53a0b207d5e33567bc75aeec31d209c573c47975f63b390e20eaee4b06ec7c51d1ae12c8194b623099872b225e7cbbb1f13b486c82bb6aa6e664ee6fd726b316873db8aa4f9aaa48bfea65819d81a109d511c82215269af'  # Replace with your actual password
        response = requests.post('http://localhost:3000/keys', json={'password': password})
        
        # Check if the response is successful
        response.raise_for_status()

        # Process the response JSON
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching keys: {e}")
        return None

def update_keys():
    global secretJwtKey
    new_keys = fetch_latest_keys()
    if new_keys:
        # Update your keys with the new ones
        secretJwtKey = new_keys['secretKey']
        print("What THe:", secretJwtKey)
        return "Keys Fetched"

def run_scheduler():
    update_keys()
    schedule.every().hour.do(update_keys)
    schedule.every().day.at("00:00").do(update_keys)
    
    while True:
        schedule.run_pending()
        time.sleep(1)

def check_token_validity(authorization_header):
    try:
        # Check if the header starts with 'Bearer'
        if not authorization_header or not authorization_header.startswith('Bearer: '):
            return False
        
        if authorization_header.startswith('Bearer: '):
            # Extract the token part after 'Bearer '
            jwt_token = authorization_header.split('Bearer: ')[1]
            print("Split:", jwt_token)

            blacklist_query = "SELECT * FROM token_blacklist WHERE token = %s"

            whitelist_query = "SELECT * FROM token_whitelist WHERE token = %s"

            connection = pool.connection()

            with connection.cursor() as cursor:
                cursor.execute(blacklist_query, (jwt_token))
                blacklisted_rows = cursor.fetchall()
                cursor.execute(whitelist_query, (jwt_token))
                whitelisted_rows = cursor.fetchall()

            decoded_token = jwt.decode(jwt_token, secretJwtKey, algorithms=["HS512"])
    
            # Check if the token is expired
            current_timestamp = int(datetime.utcnow().replace(tzinfo=timezone.utc).timestamp())

            if decoded_token['exp'] < current_timestamp:
                print("Token has expired.")
                return False
            
            if not blacklisted_rows and whitelisted_rows:
                print("Token is valid and not blacklisted.")
                return True
            else:
                print("Decoded Token:", decoded_token)
                print("Token is invalid and blacklisted.")
                return False
        else:
            # If the header format is not as expected
            return False
    except Exception as e:
        # Handle other unexpected errors
        print({'error': str(e)})
        return False

@app.route('/create_user_dict', methods=['POST'])
def create_user_dict():
    try:
        print(secretJwtKey)
        authorization_header = request.headers.get('Authorization')

        if authorization_header is None:
            return "Token is Invalid"
        
        isValid = check_token_validity(authorization_header)
        print(isValid)
        
        if not isValid:
            print('Invalid Token.')
            return jsonify({'error': 'Invalid Token'}), 500
        else:
            print('Valid Token')
 
        if 'id' in request.form:
            account_id = int(request.form['id'])
            id_from_cookie = getAccountIdFromCookie(authorization_header)

            if account_id == id_from_cookie:
                print('Match')
            else:
                return jsonify({'error': 'Access forbidden'}), 401

            connection = pool.connection()

            with connection.cursor() as cursor:
                sql = "SELECT email_address FROM user_account WHERE account_id = %s;"
                cursor.execute(sql, (account_id,))
                result = cursor.fetchone()

            if result:
                email = result[0]

        elif 'email' in request.form:
            email = request.form['email']
            id = getAccountIdFromCookie(authorization_header)
            email_from_cookie = getEmailAddressById(id, authorization_header)

            if email != email_from_cookie:
                return jsonify({'error': 'Access forbidden'}), 401

        global user_dicts
        global encrypted_data_dict
        global decrypted_data_dict

        # Check if user dictionary already exists for the email
        if email not in user_dicts:
            # If not, create user-specific dictionaries
            user_dicts[email] = {
                'encrypted_data_dict': {},
                'decrypted_data_dict': {}
            }
        print(user_dicts)
        # encrypted_data_dict = user_dicts[email]["encrypted_data_dict"]
        # decrypted_data_dict = user_dicts[email]["decrypted_data_dict"]
        print('big info here')
        print(user_dicts)
        return jsonify("User dictionary created.")
    except Exception as e:
        print("Error:", e)
        return jsonify({'error': str(e)}), 500

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg'}  # Define the allowed image file extensions

@app.route('/upload', methods=['POST'])
def upload():
    authorization_header = request.headers.get('Authorization')

    if authorization_header is None:
        return "Token is Invalid"
    
    isValid = check_token_validity(authorization_header)
    
    if not isValid:
        print('Invalid Token.')
        return "Invalid Token."
    else:
        print('Valid Token')

    username = request.form.get('name')
    uploaded_file = request.files.get('profile-picture')
    account_id = int(request.form.get('id'))
    id_from_cookie = getAccountIdFromCookie(authorization_header)

    if account_id == id_from_cookie:
        print('Match')
    else:
        return jsonify({'error': 'Access forbidden'}), 401

    print(uploaded_file, username)

    if uploaded_file is None and username is not None:
        try:
            # Proceed with the database update for username only
            sql = "UPDATE user_account SET username = %s  WHERE account_id = %s"
            connection = pool.connection()

            with connection.cursor() as cursor:
                cursor.execute(sql, (username, account_id))
            connection.commit()
            return jsonify({'message': 'Username updated successfully'})
        except Exception as e:
            connection.rollback()
            return jsonify({'error': str(e)}), 500

    print("hello")

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
        sql = "UPDATE user_account SET username = %s, profile_picture = %s WHERE account_id = %s"
        connection = pool.connection()
        
        with connection.cursor() as cursor:
            cursor.execute(sql, (username, file_bytes, account_id))
        connection.commit()
        return jsonify({'message': 'File uploaded successfully'})
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/aes_keygen', methods=['GET'])
def aes_keygen():
    try:
        generated_key = get_random_bytes(32)
        print(generated_key, file=sys.stderr)
        return jsonify({'key': generated_key.hex()})
    except Exception as e:
        print("Error generating key: ", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/check_key', methods=['POST'])
def check_key():
    try:
        authorization_header = request.headers.get('Authorization')

        if authorization_header is None:
            return "Token is Invalid"
        
        isValid = check_token_validity(authorization_header)
        
        if not isValid:
            print('Invalid Token.')
            return "Invalid Token."
        else:
            print('Valid Token')
        #secure file upload
        uploaded_file = request.files['file']
        file_content = uploaded_file.read()
        file_size = len(file_content)
        file_name = uploaded_file.filename

        key_file_content = base64.b64encode(file_content).decode('utf-8')

        # Check if the file size is exactly 32 bytes
        if file_size == 64:
            return jsonify({'fileName': file_name, 'keyContent': key_file_content})
        else:
            return jsonify({"error": "Invalid key size. The key must be 32 bytes."}), 400

    except Exception as e:
        print("Error generating key: ", str(e))
        return jsonify({"error": str(e)}), 500

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

def store_secret(email, secret):
    try:
        connection = pool.connection()

        with connection.cursor() as cursor:
            sql = "UPDATE user_account SET tfa_secret = %s WHERE email_address = %s"
            cursor.execute(sql, (secret, email))
        connection.commit()
    except Exception as e:
        connection.rollback()
        print("Error storing secret: ", str(e)), 500

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

def get_file_size(file_storage):
    # Seek to the end of the file to get its size
    file_storage.stream.seek(0, 2)
    file_size = file_storage.stream.tell()
    file_storage.stream.seek(0)  # Reset the stream position to the beginning
    return file_size

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
        authorization_header = request.headers.get('Authorization')

        if authorization_header is None:
            return "Token is Invalid"
        
        isValid = check_token_validity(authorization_header)
        
        if not isValid:
            print('Invalid Token.')
            return "Invalid Token."
        else:
            print('Valid Token')

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
        return {"isValid": False, "error": str(e)}, 500

@app.route('/encrypt', methods=['POST'])
def encrypt_files():
    try:
        authorization_header = request.headers.get('Authorization')
        
        if authorization_header is None:
            return "Token is Invalid"
        
        isValid = check_token_validity(authorization_header)
        
        if not isValid:
            print('Invalid Token.')
            return "Invalid Token."
        else:
            print('Valid Token')


        
        uploaded_files = request.files.getlist('files')
        total_size_bytes = sum(get_file_size(file_storage) for file_storage in uploaded_files)
        print(total_size_bytes)

        max_size_gb = 1
        max_size_bytes = max_size_gb * 1024 * 1024 * 1024

        if total_size_bytes > max_size_bytes:
            return jsonify({'error': 'Total file size exceeds 1 GB limit'}), 400
        print(uploaded_files)

        email = request.form['email']
        id = getAccountIdFromCookie(authorization_header)
        email_from_cookie = getEmailAddressById(id, authorization_header)


        if email != email_from_cookie:
            return jsonify({'error': 'Access forbidden'}), 401

        clear_dict = request.form['clear']
        print(clear_dict)
        if clear_dict == '0':
            print("SHIT MAN")
            
            
            user_dicts[email]['encrypted_data_dict'].clear()
            
          
        hex_value = request.form['hex']
        print(hex_value)
        key = bytes.fromhex(hex_value)

        # Create a BytesIO object to store the ZIP file in memory
        for uploaded_file in uploaded_files:
            nonce = get_random_bytes(12)

            file_size_bytes = uploaded_file.content_length
            print(file_size_bytes)
            formatted_size = format_size(file_size_bytes)
            print(formatted_size)
            header = f'{format_date()} {formatted_size}'
            header_bytes = header.encode('utf-8')

            # filename = secure_filename(uploaded_file.filename)
            file_name, file_extension = os.path.splitext(uploaded_file.filename)
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

            user_dicts[email]['encrypted_data_dict'][new_file_name] = concat
            print("GODDAMNIT")
        
            #encrypted_data_dict[new_file_name] = concat

        return "End of Encryption", 200

    except Exception as e:
        
        print("Error processing Files:", str(e))
        return {"isValid": False, "error": str(e)}, 500

@app.route('/decrypt', methods=['POST'])
def decrypt_files():
    try:
        authorization_header = request.headers.get('Authorization')
        email = request.form['emailuser']

        if authorization_header is None:
            return "Token is Invalid"
        
        isValid = check_token_validity(authorization_header)
        
        if not isValid:
            print('Invalid Token.')
            return "Invalid Token."
        else:
            print('Valid Token')

        uploaded_files = request.files.getlist('files')
        total_size_bytes = sum(get_file_size(file_storage) for file_storage in uploaded_files)
        print(total_size_bytes)

        max_size_gb = 1
        max_size_bytes = max_size_gb * 1024 * 1024 * 1024

        if total_size_bytes > max_size_bytes:
            return jsonify({'error': 'Total file size exceeds 1 GB limit'}), 400
        print(uploaded_files)

        clear_dict = request.form['clear']
        hex_key = request.form['hex']
        key = bytes.fromhex(hex_key)

        if clear_dict == '0':
            user_dicts[email]["decrypted_data_dict"].clear()
            

        for uploaded_file in uploaded_files:
            # filename = secure_filename(uploaded_file.filename)
            file_name, file_extension = os.path.splitext(uploaded_file.filename)

            if file_extension.lower() not in {'.enc', '.zip'}:
                return jsonify("error"), 500

            if file_name.startswith("encrypted_"):
                file_name = file_name.replace("encrypted_", "decrypted_")
                print(file_name, 'changed')

            if file_extension.lower() == '.zip':
                decrypted_zip_data = BytesIO()

                with zipfile.ZipFile(uploaded_file, 'r') as zip_ref:
                    for zip_file_info in zip_ref.infolist():
                        zip_file_name = zip_file_info.filename
                        file_name2, file_extension2 = os.path.splitext(zip_file_name)

                        if zip_file_name.lower().endswith('.enc'):
                            file_data = zip_ref.read(zip_file_name)
                            header_bytes_unpadded = unpad(file_data[:48], 48)
                            nonce = file_data[48:60]
                            ciphertext_unpadded = unpad(file_data[60:-16], 16)
                            tag = file_data[-16:]

                            aes_gcm = AES.new(key, AES.MODE_GCM, nonce=nonce)
                            aes_gcm.update(header_bytes_unpadded)
                            plaintext = aes_gcm.decrypt_and_verify(ciphertext_unpadded, tag)
                            extension = unpad(plaintext[:16], 16)
                            file_data = plaintext[16:]

                            original_extension = extension.decode('utf-8')
                            file_with_original_extension = f'{file_name2}{original_extension}'
                            print(file_with_original_extension)

                            with zipfile.ZipFile(decrypted_zip_data, 'a', zipfile.ZIP_STORED, allowZip64=True) as zipf:
                                zipf.writestr(file_with_original_extension, file_data)

                    decrypted_zip_data.seek(0)
                    join_file_name = f'{file_name}{file_extension}'
                    user_dicts[email]['decrypted_data_dict'][join_file_name] = decrypted_zip_data.getvalue()

                    for keys, value in user_dicts[email]['decrypted_data_dict'].items():
                        print(keys, 'key')

                    # Print the number of files within decrypted_zip_data
                    num_files_in_zip = len(zipfile.ZipFile(decrypted_zip_data).infolist())
                    print(f"Number of files in decrypted_zip_data: {num_files_in_zip}")

                file_extension = file_extension.replace('.', '')
                return jsonify(decrypted_extension=file_extension)
            
            else:
                file_data = uploaded_file.read()
                header_bytes_unpadded = unpad(file_data[:48], 48)
                nonce = file_data[48:60]
                ciphertext_unpadded = unpad(file_data[60:-16], 16)
                tag = file_data[-16:]

                aes_gcm = AES.new(key, AES.MODE_GCM, nonce=nonce)
                aes_gcm.update(header_bytes_unpadded)
                plaintext = aes_gcm.decrypt_and_verify(ciphertext_unpadded, tag)
                extension = unpad(plaintext[:16], 16)
                file_data = plaintext[16:]
            
                original_extension = extension.decode('utf-8')
                file_with_original_extension = f'{file_name}{original_extension}'

                user_dicts[email]['decrypted_data_dict'][file_with_original_extension] = file_data

                file_extension = original_extension.replace('.', '')

                return jsonify(decrypted_extension=file_extension)

    except Exception as e:
        print("Error processing Files:", str(e))
        return {"isValid": False, "error": str(e)}, 500
    
@app.route('/decrypt2', methods=['POST'])
def decrypt_files2():
    try:
        
        authorization_header = request.headers.get('Authorization')

        if authorization_header is None:
            return "Token is Invalid"
        email = request.form['email']
        isValid = check_token_validity(authorization_header)
        
        if not isValid:
            print('Invalid Token.')
            return "Invalid Token."
        else:
            print('Valid Token')

        uploaded_files = request.files.getlist('files')
        total_size_bytes = sum(get_file_size(file_storage) for file_storage in uploaded_files)
        print(total_size_bytes)

        max_size_gb = 1
        max_size_bytes = max_size_gb * 1024 * 1024 * 1024

        if total_size_bytes > max_size_bytes:
            return jsonify({'error': 'Total file size exceeds 1 GB limit'}), 400
        print(uploaded_files)

        hex_key = request.form['hex']
        key = bytes.fromhex(hex_key)

        for uploaded_file in uploaded_files:
            # filename = secure_filename(uploaded_file.filename)
            file_name, file_extension = os.path.splitext(uploaded_file.filename)

            if file_extension.lower() not in {'.enc', '.zip'}:
                return jsonify("error"), 500

            if file_name.startswith("encrypted_"):
                file_name = file_name.replace("encrypted_", "decrypted_")
                print(file_name, 'changed')

            if file_extension.lower() == '.zip':
                decrypted_zip_data = BytesIO()

                with zipfile.ZipFile(uploaded_file, 'r') as zip_ref:
                    for zip_file_info in zip_ref.infolist():
                        zip_file_name = zip_file_info.filename
                        file_name2, file_extension2 = os.path.splitext(zip_file_name)

                        if zip_file_name.lower().endswith('.enc'):
                            file_data = zip_ref.read(zip_file_name)
                            header_bytes_unpadded = unpad(file_data[:48], 48)
                            nonce = file_data[48:60]
                            ciphertext_unpadded = unpad(file_data[60:-16], 16)
                            tag = file_data[-16:]

                            aes_gcm = AES.new(key, AES.MODE_GCM, nonce=nonce)
                            aes_gcm.update(header_bytes_unpadded)
                            plaintext = aes_gcm.decrypt_and_verify(ciphertext_unpadded, tag)
                            extension = unpad(plaintext[:16], 16)
                            file_data = plaintext[16:]

                            original_extension = extension.decode('utf-8')
                            file_with_original_extension = f'{file_name2}{original_extension}'
                            print(file_with_original_extension)

                            with zipfile.ZipFile(decrypted_zip_data, 'a', zipfile.ZIP_STORED, allowZip64=True) as zipf:
                                zipf.writestr(file_with_original_extension, file_data)

                    decrypted_zip_data.seek(0)
                    join_file_name = f'{file_name}{file_extension}'
                    user_dicts[email]['decrypted_data_dict'][join_file_name] = decrypted_zip_data.getvalue()

                    for keys, value in user_dicts[email]['decrypted_data_dict'].items():
                        print(keys, 'key')

                    # Print the number of files within decrypted_zip_data
                    num_files_in_zip = len(zipfile.ZipFile(decrypted_zip_data).infolist())
                    print(f"Number of files in decrypted_zip_data: {num_files_in_zip}")

                file_extension = file_extension.replace('.', '')

                WideFileName = join_file_name.encode("utf-8").decode("latin-1")
                # Set the Content-Disposition header to specify the filename
                response = Response(decrypted_zip_data.getvalue(), content_type='application/octet-stream')
                response.headers.add("Access-Control-Expose-Headers", "Content-Disposition")
                response.headers['Content-Disposition'] = f'attachment; filename="{WideFileName}"'
                return response, 200
                # return jsonify(decrypted_extension=file_extension)
            
            else:
                file_data = uploaded_file.read()
                header_bytes_unpadded = unpad(file_data[:48], 48)
                nonce = file_data[48:60]
                ciphertext_unpadded = unpad(file_data[60:-16], 16)
                tag = file_data[-16:]

                aes_gcm = AES.new(key, AES.MODE_GCM, nonce=nonce)
                aes_gcm.update(header_bytes_unpadded)
                plaintext = aes_gcm.decrypt_and_verify(ciphertext_unpadded, tag)
                extension = unpad(plaintext[:16], 16)
                file_data = plaintext[16:]
            
                original_extension = extension.decode('utf-8')
                file_with_original_extension = f'{file_name}{original_extension}'

                user_dicts[email]['decrypted_data_dict'][file_with_original_extension] = file_data

                file_extension = original_extension.replace('.', '')
                
                WideFileName = file_with_original_extension.encode("utf-8").decode("latin-1")
                # Set the Content-Disposition header to specify the filename
                response = Response(file_data, content_type='application/octet-stream')
                response.headers.add("Access-Control-Expose-Headers", "Content-Disposition")
                response.headers['Content-Disposition'] = f'attachment; filename="{WideFileName}"'
                return response, 200

                # return jsonify(decrypted_extension=file_extension)

    except Exception as e:
        print("Error processing Files:", str(e))
        return {"isValid": False, "error": str(e)}, 500

@app.route('/clear_history', methods=['POST'])
def clear_history():
    try:
        authorization_header = request.headers.get('Authorization')

        if authorization_header is None:
            return "Token is Invalid"
        
        isValid = check_token_validity(authorization_header)
        
        if not isValid:
            print('Invalid Token.')
            return "Invalid Token."
        else:
            print('Valid Token')

        id = int(request.form['id'])
        id_from_cookie = getAccountIdFromCookie(authorization_header)

        if id == id_from_cookie:
            print('Match')
        else:
            return jsonify({'error': 'Access forbidden'}), 401

        sql = "DELETE FROM history " \
              "WHERE account_id IN (SELECT account_id FROM user_account WHERE account_id = %s);"
        
        connection = pool.connection()

        with connection.cursor() as cursor:
            cursor.execute(sql, (id))

        connection.commit()  # Make sure to commit the changes after executing the query

        return 'History Cleared.'

    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500

    
@app.route('/display_history', methods=['POST'])
def display_history():
    try:
        authorization_header = request.headers.get('Authorization')

        if authorization_header is None:
            return "Token is Invalid"
        
        isValid = check_token_validity(authorization_header)
        
        if not isValid:
            print('Invalid Token.')
            return "Invalid Token."
        else:
            print('Valid Token')

        account_id = int(request.form['id'])
        id_from_cookie = getAccountIdFromCookie(authorization_header)

        if account_id == id_from_cookie:
            print('Match')
        else:
            return jsonify({'error': 'Access forbidden'}), 401

        sql = "SELECT history.time, history.file_name, history.file_size, history.type, history.key_name " \
            "FROM history " \
            "INNER JOIN user_account ON history.account_id = user_account.account_id " \
            "WHERE user_account.account_id = %s;"

        connection = pool.connection()

        with connection.cursor() as cursor:
            cursor.execute(sql, (account_id))
            rows = cursor.fetchall()
            print(rows)
            
        column_names = [desc[0] for desc in cursor.description]
        result = [dict(zip(column_names, row)) for row in rows]

        return jsonify(result)

    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/add_to_encryption_history', methods=['POST'])
def encrypt_history():
    try:
        authorization_header = request.headers.get('Authorization')
        print("Authorization_header", authorization_header) 

        if authorization_header is None:
            return "Token is Invalid"
        
        isValid = check_token_validity(authorization_header)
        
        if not isValid:
            print('Invalid Token.')
            return "Invalid Token."
        else:
            print('Valid Token')

        uploaded_file = request.files['files']
        file_name = uploaded_file.filename
        file_data = uploaded_file.read()
        file_size = format_size(len(file_data))
        account_id = int(request.form['id'])  # Use request.form for form data
        id_from_cookie = getAccountIdFromCookie(authorization_header)
        if account_id == id_from_cookie:
            print('Match')
        else:
            return jsonify({'error': 'Access forbidden'}), 401
        # Assuming you have a function to retrieve account_id based on email
        key_name = request.form['key_name']
        print("KEY NAMEZ:", key_name)
        type_of_encryption = request.form['type']  # Use request.form for form data
        print("TYPEZZZ:", type_of_encryption)

        # Proceed with the database update for username only
        sql = "INSERT INTO history (time, file_name, file_size, account_id, type, key_name) VALUES (%s, %s, %s, %s, %s, %s);"

        connection = pool.connection()
        
        with connection.cursor() as cursor:
            cursor.execute(sql, (datetime.now(), file_name, file_size, account_id, type_of_encryption, key_name))
        
        connection.commit()
        
        return jsonify({'message': 'Data inserted successfully'})
    
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/add_to_decryption_history', methods=['POST'])
def decrypt_history():
    try:
        authorization_header = request.headers.get('Authorization')

        if authorization_header is None:
            return "Token is Invalid"
        
        isValid = check_token_validity(authorization_header)
        
        if not isValid:
            print('Invalid Token.')
            return "Invalid Token."
        else:
            print('Valid Token')
            
        uploaded_file = request.files['files']
        file_name = uploaded_file.filename
        file_data = uploaded_file.read()
        file_size = format_size(len(file_data))
        account_id = int(request.form['id'])  # Use request.form for form data
        id_from_cookie = getAccountIdFromCookie(authorization_header)
        if account_id == id_from_cookie:
            print('Match')
        else:
            return jsonify({'error': 'Access forbidden'}), 401
        # Assuming you have a function to retrieve account_id based on email
        type_of_encryption = request.form['type']  # Use request.form for form data
        key_name = request.form['key_name']

        # Proceed with the database update for username only
        sql = "INSERT INTO history (time, file_name, file_size, account_id, type, key_name) VALUES (%s, %s, %s, %s, %s, %s);"

        connection = pool.connection()
        
        with connection.cursor() as cursor:
            cursor.execute(sql, (datetime.now(), file_name, file_size, account_id, type_of_encryption, key_name))
        
        connection.commit()
        
        return jsonify({'message': 'Data inserted successfully'})
    
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/send_file/<filename>', methods=['POST'])
def send_file_to_user(filename):
    authorization_header = request.headers.get('Authorization')
    print("Send User Authorizataion: ", authorization_header)

    if authorization_header is None:
        return "Token is Invalid"

    isValid = check_token_validity(authorization_header)

    if not isValid:
        print('Invalid Token.')
        return "Invalid Token."
    else:
        print('Valid Token')
    
    key_base64 = request.form.get('key')
    shared_to_id = request.form.get('target_id')
    shared_by_email = request.form.get('email')

    connection = pool.connection()
    
    try:
        with connection.cursor() as cursor:
            sql = "SELECT * FROM user_account WHERE account_id = %s"
            cursor.execute(sql, (shared_to_id,))
            result = cursor.fetchall()
            if len(result) == 0:
                return jsonify({'error': 'Access forbidden'}), 401
            # Process the query result here
        connection.commit()
    except Exception as e:
        return jsonify({'error': 'Access forbidden'}), 401
    
    id = getAccountIdFromCookie(authorization_header)
    email_from_cookie = getEmailAddressById(id, authorization_header)

    if shared_by_email != email_from_cookie:
        return jsonify({'error': 'Access forbidden'}), 401

    print(filename, 'file')
    
    # Assuming encrypted_data_dict is a global dictionary
    for key, value in user_dicts[shared_by_email]["encrypted_data_dict"].items():
        print(key, 'key')

    if not key_base64 or not shared_to_id or not shared_by_email:
        abort(400, 'Invalid request data')

    encrypted_data = user_dicts[shared_by_email]["encrypted_data_dict"].get(filename, None)

    if encrypted_data is None:
        return 'File not found', 404
    
    delimiter = '|!|'
    encrypted_data_base64 = base64.b64encode(encrypted_data).decode('utf-8')

    concat = key_base64 + delimiter + encrypted_data_base64

    WideFileName = filename.encode("utf-8").decode("latin-1")

    try:
        with connection.cursor() as cursor:
            sql = """INSERT INTO file_shared (file, file_name, date_shared, shared_by, shared_to)
            VALUES (%s, %s, NOW(), 
            (SELECT account_id FROM user_account WHERE email_address = %s),
            %s)"""
            cursor.execute(sql, (concat, WideFileName, shared_by_email, shared_to_id))
        connection.commit()
    except Exception as e:
        print(f"Error inserting into database: {e}", file=sys.stderr)
        return 'Internal Server Error', 500
    finally:
        connection.close()

    return 'File shared successfully.', 200

@app.route('/send_zip/<filename>', methods=['POST'])
def send_zip_file_to_user(filename):
    authorization_header = request.headers.get('Authorization')
    print("Send User Authorizataion: ", authorization_header)

    if authorization_header is None:
        return "Token is Invalid"
        
    isValid = check_token_validity(authorization_header)
    if not isValid:
        print('Invalid Token.')
        return "Invalid Token."
    else:
        print('Valid Token')

    print(filename, 'file')
    email = request.form.get('useremail')
    # Assuming encrypted_data_dict is a global dictionary

    # for key, value in encrypted_data_dict.items():
    #     print(key, 'key')
    for key, value in user_dicts[email]['encrypted_data_dict'].items():
        print(key, 'key')

    key_base64 = request.form.get('key')
    shared_to_id = request.form.get('target_id')
    shared_by_email = request.form.get('email')

    connection = pool.connection()

    try:
        with connection.cursor() as cursor:
            sql = "SELECT * FROM user_account WHERE account_id = %s"
            cursor.execute(sql, (shared_to_id,))
            result = cursor.fetchall()
            if len(result) == 0:
                return jsonify({'error': 'Access forbidden'}), 401
            # Process the query result here
        connection.commit()
    except Exception as e:
        return jsonify({'error': 'Access forbidden'}), 401

    id = getAccountIdFromCookie(authorization_header)
    email_from_cookie = getEmailAddressById(id, authorization_header)

    if shared_by_email != email_from_cookie:
        return jsonify({'error': 'Access forbidden'}), 401

    if not key_base64 or not shared_to_id or not shared_by_email:
        abort(400, 'Invalid request data')

    encrypted_zip_data = BytesIO()

    with zipfile.ZipFile(encrypted_zip_data, 'w', zipfile.ZIP_STORED, allowZip64=True) as zipf:
        for encrypted_filename, encrypted_data in user_dicts[shared_by_email]['encrypted_data_dict'].items():
            # Add the encrypted data to the ZIP archive with the encrypted filename
            print(encrypted_filename, file=sys.stderr)
            zipf.writestr(encrypted_filename, encrypted_data)
            
    zip_filename = f'encrypted.zip'

    encrypted_zip_data.seek(0)
    user_dicts[shared_by_email][zip_filename] = encrypted_zip_data.getvalue()
    encrypted_zip_data.seek(0)
    encrypted_zip_data.truncate(0)

    for keys, value in user_dicts[shared_by_email].items():
        print(keys, file=sys.stderr)
    encrypted_data = user_dicts[shared_by_email].get(filename, None)

    if encrypted_data is None:
        return 'File not found', 404
    
    delimiter = '|!|'
    encrypted_data_base64 = base64.b64encode(encrypted_data).decode('utf-8')

    concat = key_base64 + delimiter + encrypted_data_base64
    file_name =  request.form.get('zip_name')

    try:
        with connection.cursor() as cursor:
            sql = """INSERT INTO file_shared (file, file_name, date_shared, shared_by, shared_to)
                    VALUES (%s, %s, NOW(),
                    (SELECT ua1.account_id FROM user_account ua1 WHERE ua1.email_address = %s),
                    %s)"""
            cursor.execute(sql, (concat, file_name, shared_by_email, shared_to_id))
        connection.commit()
    except Exception as e:
        print(f"Error inserting into database: {e}", file=sys.stderr)
        return 'Internal Server Error', 500
    finally:
        connection.close()

    return 'File shared successfully.', 200

@app.route('/download_single_encrypted_file/<filename>/<email>', methods=['GET'])
def download_single_encrypted_file(filename, email):
    
    print(filename, file=sys.stderr)
  
    print(email)
    for keys, value in user_dicts[email]['encrypted_data_dict'].items():
        print("GODDAMN SON")
        
        print(keys, file=sys.stderr)
    encrypted_data = user_dicts[email]['encrypted_data_dict'].get(filename, None)
    # print(encrypted_data, file=sys.stderr)
    if encrypted_data is None:
        return 'File not found', 404
    WideFileName = filename.encode("utf-8").decode("latin-1")
    # Set the Content-Disposition header to specify the filename
    response = Response(encrypted_data, content_type='application/octet-stream')
    response.headers['Content-Disposition'] = f'attachment; filename="{WideFileName}"'
    return response

@app.route('/download_zip/<filename>/<email>', methods=['GET'])
def download_zip(filename,email):

    print(filename, file=sys.stderr)
    encrypted_zip_data = BytesIO()
    
    with zipfile.ZipFile(encrypted_zip_data, 'w', zipfile.ZIP_STORED, allowZip64=True) as zipf:
        for encrypted_filename, encrypted_data in user_dicts[email]['encrypted_data_dict'].items():
            # Add the encrypted data to the ZIP archive with the encrypted filename
            print(encrypted_filename, file=sys.stderr)
            zipf.writestr(encrypted_filename, encrypted_data)
            
    zip_filename = f'encrypted.zip'

    encrypted_zip_data.seek(0)
    user_dicts[email]['encrypted_data_dict'][zip_filename] = encrypted_zip_data.getvalue()
    encrypted_zip_data.seek(0)
    encrypted_zip_data.truncate(0)

    for keys, value in user_dicts[email].items():
        print(keys, file=sys.stderr)
    encrypted_data = user_dicts[email]['encrypted_data_dict'].get(filename, None)

    if encrypted_data is None:
        return 'File not found', 404

    WideFileName = filename.encode("utf-8").decode("latin-1")
    # Set the Content-Disposition header to specify the filename
    response = Response(encrypted_data, content_type='application/octet-stream')
    response.headers['Content-Disposition'] = f'attachment; filename="{WideFileName}"'

    return response

@app.route('/download_single_decrypted_file/<filename>/<email>', methods=['GET'])
def download_single_decrypted_file(filename,email):
    authorization_header = request.headers.get('Authorization')
    isValid = check_token_validity(authorization_header)


    if not isValid:
        print('Invalid Token.')
        return "Invalid Token."
    else:
        print('Valid Token')
        
    id = getAccountIdFromCookie(authorization_header)
    email_from_cookie = getEmailAddressById(id, authorization_header)
    if email != email_from_cookie:
        return jsonify({'error': 'Access forbidden'}), 401

    print(filename, 'file')
    for keys, value in user_dicts[email].items():
        print(keys, 'key')
    decrypted_data = user_dicts[email]["decrypted_data_dict"].get(filename, None)
    # print(encrypted_data, file=sys.stderr)
    if decrypted_data is None:
        return 'File not found', 404
    WideFileName = filename.encode("utf-8").decode("latin-1")
    # Set the Content-Disposition header to specify the filename
    response = Response(decrypted_data, content_type='application/octet-stream')
    response.headers['Content-Disposition'] = f'attachment; filename="{WideFileName}"'
    return response

@app.route('/download_decrypted_zip/<filename>/<email>', methods=['GET'])
def download_decrypted_zip(filename,email):
    print(filename, file=sys.stderr)
    for keys, value in user_dicts[email].items():
        print(keys, file=sys.stderr)
    decrypted_zip_data = BytesIO()

    with zipfile.ZipFile(decrypted_zip_data, 'w', zipfile.ZIP_STORED, allowZip64=True) as zipf:
        for decrypted_filename, decrypted_data in user_dicts[email]["decrypted_data_dict"].items():
            # Add the encrypted data to the ZIP archive with the encrypted filename
            print(decrypted_filename, file=sys.stderr)
            zipf.writestr(decrypted_filename, decrypted_data)

    zip_filename = f'unencrypted.zip'

    decrypted_zip_data.seek(0)
    if zip_filename in user_dicts[email].keys():
        pass
    else:
        user_dicts[email]["decrypted_data_dict"][zip_filename] = decrypted_zip_data.getvalue()
    decrypted_zip_data.seek(0)
    decrypted_zip_data.truncate(0)

    decrypted_data = user_dicts[email].get(filename, None)

    if decrypted_data is None:
        return 'File not found', 404

    WideFileName = filename.encode("utf-8").decode("latin-1")
    # Set the Content-Disposition header to specify the filename
    response = Response(decrypted_data, content_type='application/octet-stream')
    response.headers['Content-Disposition'] = f'attachment; filename="{WideFileName}"'

    return response

@app.route('/clear_encrypted_folder/<email>', methods=['GET'])
def clear_encrypted_folder(email):
    
    
    user_dicts[email]["encrypted_data_dict"].clear()
    return 'Encrypted folder cleared', 200

@app.route('/clear_decrypted_folder/<email>', methods=['GET'])
def clear_decrypted_folder(email):
    print("fuck object promise dawg")
    print(email)
    user_dicts[email]["decrypted_data_dict"].clear()
    #decrypted_data_dict.clear()
    return 'Decrypted folder cleared', 200

user_secrets = {}

@app.route('/generate_2fa_qr_code', methods=['POST'])
def generate_2fa_qr_code():
    try:
        authorization_header = request.headers.get('Authorization')

        if authorization_header is None:
            return "Token is Invalid"
        
        isValid = check_token_validity(authorization_header)
        
        if not isValid:
            print('Invalid Token.')
            return "Invalid Token."
        else:
            print('Valid Token')

        email = request.form.get('email')
        id = getAccountIdFromCookie(authorization_header)
        email_from_cookie = getEmailAddressById(id, authorization_header)

        if email != email_from_cookie:
            return jsonify({'error': 'Access forbidden'}), 401
        
        print("WHAT IS THE EMAIL:", email)

        # Generate a new secret for the user
        secret = pyotp.random_base32()

        # Store the secret securely
        user_secrets[email] = secret

        print("Checking this:", user_secrets)

        totp = pyotp.TOTP(secret)
        otp = totp.now()
        qr_code_url = totp.provisioning_uri(email, issuer_name="jtr.lol")

        return jsonify({'qr_code_url': qr_code_url, 'otp': otp, 'secret': secret})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/verify_otp', methods=['POST'])
def verify_otp():
    try:
        authorization_header = request.headers.get('Authorization')
        
        if authorization_header is None:
            return "Token is Invalid"
        
        isValid = check_token_validity(authorization_header)
        
        if not isValid:
            print('Invalid Token.')
            return "Invalid Token."
        else:
            print('Valid Token')

        email = request.form.get('email')
        id = getAccountIdFromCookie(authorization_header)
        email_from_cookie = getEmailAddressById(id, authorization_header)

        if email != email_from_cookie:
            return jsonify({'error': 'Access forbidden'}), 401
        
        otp_value = request.form.get('otp')

        # Retrieve the secret associated with the user
        print("checing again:", email)
        print("checking:", user_secrets)
        secret = user_secrets.get(email)
        print("GETTING SECRET:", secret)

        if secret is None:
            raise ValueError('Secret key not found for the specified user.')

        # Verify the OTP
        totp = pyotp.TOTP(secret)
        is_valid = totp.verify(otp_value)

        if is_valid:
            # Insert the secret into the database upon successful OTP validation
            insert_secret_into_db(email, secret)
            return jsonify({"is_valid": 1, "message": "OTP is valid"})
        else:
            return jsonify({"is_valid": 0, "message": "Invalid OTP"})
    except Exception as e:
        return jsonify({"is_valid": 0, "message": f"Error: {str(e)}"}), 500

@app.route('/verify_2fa', methods=['POST'])
def verify_2fa():
    try:
        data = request.get_json()
        print('data:', data)
        user_input_otp = data.get('otp')
        email = data.get('email')

        print("OTPPPP???:", user_input_otp)
        print("emaillll:", email)
        # Retrieve the secret associated with the user

        try:
            connection = pool.connection()
            with connection.cursor() as cursor:
                sql = "SELECT tfa_secret FROM user_account WHERE email_address = %s"
                cursor.execute(sql, (email,))
                result = cursor.fetchone()  # Fetch one row

                if result:
                    secret = result[0]
                else:
                    secret = None

            connection.commit()

        except Exception as e:
            connection.rollback()
            print("Error executing SQL query:", str(e))
            return "Error executing SQL query", 500

        if secret is None:
            raise ValueError('Secret key not found for the specified user.')

        # Verify the OTP
        totp = pyotp.TOTP(secret)
        print("totp: ", totp)
        is_valid = totp.verify(user_input_otp)
        print("IsitValid: ", is_valid)

        if is_valid:
            return jsonify({'message': 'OTP is valid', 'email': email})
        else:
            return jsonify({'error': 'Invalid OTP', 'email': email})
    except Exception as e:
        return jsonify({'error': str(e), 'email': email}), 500


@app.route('/send_secret', methods=['POST'])
def send_secret():
    try:
        data = request.json
        user_key = data.get('email')
        secret = data.get('secret')

        # Store the secret in user_secrets dictionary
        user_secrets[user_key] = secret

        return jsonify({'message': 'Secret received and stored successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/send_email', methods=['POST'])
def send_email():
    try:
        data = request.json
        email = data.get('email')
        # Store the secret in user_secrets dictionary

        return jsonify({'message': 'Email Sent'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500                      

def insert_secret_into_db(email, secret):
    try:
        connection = pool.connection()
        with connection.cursor() as cursor:
            sql = "UPDATE user_account SET tfa_secret = %s WHERE email_address = %s"
            cursor.execute(sql, (secret, email))
        connection.commit()
    except Exception as e:
        connection.rollback()
        print("Error inserting secret into the database: ", str(e)), 500

def encrypt_email(email):
    cipher = AES.new(SECRET_KEY, AES.MODE_CBC, IV)
    print("e1")
    print("ENCRYPTION KEY1:", SECRET_KEY)
    print("Encryption IV:", IV)
    print("e2")
    padded_email = pad(email.encode(), AES.block_size)
    print("e3")
    encrypted_email = cipher.encrypt(padded_email)
    print("e4")
    return b64encode(IV + encrypted_email).decode()

def decrypt_email(encrypted_email):
    encrypted_data = b64decode(encrypted_email.encode())
    print("d1", encrypted_data)
    iv = encrypted_data[:16]
    print("d2", iv)
    print("decryption KEY1:", SECRET_KEY)
    cipher = AES.new(SECRET_KEY, AES.MODE_CBC, iv)
    print("d3", cipher)
    
    decrypted_data = unpad(cipher.decrypt(encrypted_data[16:]), AES.block_size)
    print("d4")
    return decrypted_data.decode()

@app.route('/encrypt_email', methods=['POST'])
def encrypt_email_route():
    data = request.get_json()
    email = data.get('email', '')
    encrypted_email = encrypt_email(email)
    return jsonify({'encryptedEmail': encrypted_email})

@app.route('/decrypt_email', methods=['POST'])
def decrypt_email_route():
    data = request.get_json()
    encrypted_email = data.get('encryptedEmail', '')
    decrypted_email = decrypt_email(encrypted_email)
    return jsonify({'decryptedEmail': decrypted_email})

def check_email_existence(api_key, email):
    base_url = "https://api.hunter.io/v2/email-verifier"

    params = {
        'email': email,
        'api_key': api_key,
    }

    response = requests.get(base_url, params=params)
    data = response.json()

    if response.status_code == 200:
        result = data.get('data', {})
        if result.get('result') == 'deliverable':
            return True
        else:
            return False
    else:
        print(f"Error: {data.get('errors')}")
        return False

@app.route('/check_email', methods=['POST'])
def check_email_route():
    api_key = '86da3112fcda1e710eaf536b25298d036bd2424b'
    email = request.form.get('email')

    if not api_key or not email:
        return jsonify({'error': 'Missing required parameters'})

    if check_email_existence(api_key, email):
        return jsonify({'status': 'exists'})
    else:
        return jsonify({'status': 'not exists'})
    
#Start of Email Verication Email Code

token_evpayload = {
    'token': '',
    'hashed_token': '',
    'expiration': 0,
    'email' : ''
}


@app.route('/email_verification', methods=['POST'])
def email_verification():
    data = request.get_json()
    print(f"Received JSON data: {data}")
    emailaddress = data.get('email','')
    print("EMIASNMDA:", emailaddress)
    username = data.get('username', '')

    global ev_dicts
    global token_evpayload

    if username not in ev_dicts:
        ev_dicts[username] = {
            'token_evpayload': {
                'token': '',
                'hashed_token': '',
                'expiration' : '',

            }
        }

    token_evpayload = ev_dicts[username]['token_evpayload']
    print("New Dict:", ev_dicts)

    expiration_time = datetime.utcnow() + timedelta(minutes=15)
    expiration_timestamp = int(expiration_time.timestamp())

    verification_token = secrets.token_urlsafe(32)
    print("VERFICATION TOKEN:", verification_token)

    hashed_token = hashlib.sha256(verification_token.encode()).hexdigest()

    print("Checking THis hash:", hashed_token)

    token_evpayload['token'] = verification_token
    token_evpayload['hashed_token'] = hashed_token
    token_evpayload['expiration'] = expiration_timestamp
    encoded_username = base64.b64encode(username.encode()).decode()
    url_parameters = f"token={hashed_token}.{encoded_username}"
    print('Update DICTS', ev_dicts)
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = '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'

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    subject = "Email Verification"
    html_content = f"""
    <html>
        <head>
            <style>
                body {{
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }}
                h1 {{
                    color: #333333;
                }}
                p {{
                    color: #666666;
                }}
                a {{
                    display: inline-block;
                    padding: 10px 20px;
                    margin-top: 20px;
                    background-color: #3498db;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 5px;
                }}
                a:hover {{
                    background-color: #2980b9;
                }}
            </style>
        </head>
        <body>
            <h1>Verify Your Email Address</h1>
            <p>Thank you for signing up! Click the link below to verify your email address:</p>
            <a href="http://localhost:3000/activation?{url_parameters}">Verify Email</a>
        </body>
    </html>
    """
    sender = {"name":"JTR Support","email":"jtrhelp123@gmail.com"}
    print(f"Recipient's email address: {emailaddress}")
    to = [{'email': emailaddress}]
    cc = None
    bcc =None
    reply_to = None
    headers = {"Some-Custom-Name":"unique-id-1234"}
    params = {"parameter":"My param value","subject":"New Subject"}
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(to=to, bcc=bcc, cc=cc, reply_to=reply_to, headers=headers, html_content=html_content, sender=sender, subject=subject)

    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        pprint(api_response)
        return jsonify({'message': 'Email verification sent successfully'})
    except ApiException as e:
        print("Exception when calling SMTPApi->send_transac_email: %s\n" % e)
        return jsonify({'error': 'Failed to send email verification'})
    
def is_valid_token(hashed_token, username):
    print("Is trying is_valid_token")
    print("V1:", ev_dicts)
    print('V2:', ev_dicts[username])
    print('V3:', ev_dicts[username]['token_evpayload'])
    token = ev_dicts[username]['token_evpayload']['token']
    print("It's not about the journey:", token)
    expiration_timestamp = da_dicts[username]['token_evpayload']['expiration']

    # Validate the expiration
    current_timestamp = int(datetime.utcnow().timestamp())
    if current_timestamp > expiration_timestamp:
        return False

    # Validate the hashed token
    hash_object = hashlib.sha256(f"{token}".encode()).hexdigest()
    print('but the friends we made along the way:', hash_object)
    if hashed_token == hash_object:
        print("MET")
        return True
    
    print("NYET")
    return False

    
@app.route('/verify_account', methods=['POST'])
def verify_account():
    try:
        # Get the token from the request body
        data = request.json
        token = data.get('token', '')  
        username = data.get('username', '')
        username = base64.b64decode(username.encode()).decode()
        print("POWER OF FRIENDSHIP:", token)

        # Assuming you have a function is_valid_token for token validation
        if is_valid_token(token, username):  # Provide token_evpayload as the second argument
            print("CHECKED")
            
            if username in ev_dicts:
                print("Success")
                print("UserName:", username)

                # Assuming you have a function pool.connection() for database connection
                connection = pool.connection()

                try:
                    with connection.cursor() as cursor:
                        # Update the 'activated' column in the 'user_account' table
                        sql = "UPDATE user_account SET activated = 1 WHERE username = %s;"
                        cursor.execute(sql, (username,))
                        connection.commit()  # Commit the changes to the database

                        ev_dicts[username]['token_evpayload']['token'] = ''
                        ev_dicts[username]['token_evpayload']['hashed_token'] = ''
                        ev_dicts[username]['token_evpayload']['expiration'] = 0
                        ev_dicts[username]['token_evpayload']['email'] = ''

                        print("After Verification:", ev_dicts)

                    return jsonify({'activation_status': 'success'})

                except Exception as e:
                    print(f"Error updating database: {e}")
                    return jsonify({'activation_status': 'error'})

                finally:
                    connection.close()  # Close the database connection

        else:
            # Return error response
            print("Id aint here broski")
            return jsonify({'activation_status': 'error'})

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'activation_status': 'error'})

# Make sure to include this return statement for cases where the function does not enter the 'if' block
    return jsonify({'activation_status': 'error'})

def encrypt_user_data(user_data):
    cipher = AES.new(SECRET_KEY2, AES.MODE_CBC, IV2)
    print("ENCRYPTION KEY2:", SECRET_KEY2)
    padded_user_data = pad(user_data.encode(), AES.block_size)
    encrypted_user_data = cipher.encrypt(padded_user_data)
    print("WHAT THE:", b64encode(IV2 + encrypted_user_data).decode())
    return b64encode(IV2 + encrypted_user_data).decode()

def decrypt_user_data(encrypted_user_data):
    encrypted_data = b64decode(encrypted_user_data.encode())
    iv = encrypted_data[:16]
    print("decryption KEY2:", SECRET_KEY2)
    cipher = AES.new(SECRET_KEY2, AES.MODE_CBC, iv)
    decrypted_data = unpad(cipher.decrypt(encrypted_data[16:]), AES.block_size)
    print("WHAT THE TEH:", decrypted_data.decode())
    return decrypted_data.decode()


@app.route('/encrypt_user_data', methods=['POST'])
def encrypt_user_data_route():
    data = request.get_json()
    user_data = data.get('userData', '')
    encrypted_user_data = encrypt_user_data(user_data)
    print("data1:", encrypted_user_data)  # Call the correct function
    return jsonify({'encryptedUserData': encrypted_user_data})

@app.route('/decrypt_user_data', methods=['POST'])
def decrypt_user_data_route():
    data = request.get_json()
    encrypted_user_data = data.get('encryptedUserData', '')
    print('encrypted Data Getting:', encrypted_user_data)  # Call the correct function
    decrypted_user_data = decrypt_user_data(encrypted_user_data)
    return jsonify({'decryptedUserData': decrypted_user_data})

#End of email verification code

#Start of forget password email code

token_fppayload = {
    'token': '',
    'hashed_token': '',
    'expiration': 0,
    'email': ''
}

@app.route('/email_forgetPassword', methods=['POST'])
def email_forgetPassword():
    data = request.get_json()
    print(f"Received JSON data: {data}")
    emailaddress = data.get('email','')

    username = None

    try:
        connection = pool.connection()

        with connection.cursor() as cursor:
            sql = "SELECT COUNT(*) as count FROM user_account WHERE email_address = %s"
            cursor.execute(sql, (emailaddress,))
            rows = cursor.fetchall()
            count = rows[0][0]
            
            if count == 1:
                sql = "SELECT username FROM user_account WHERE email_address = %s"
                cursor.execute(sql, (emailaddress,))
                result = cursor.fetchone()  # Fetch one row

                if result:
                    username = result[0]
                    print("UserName?:", username)
                else:
                    username = None
                    
                connection.commit()
            else:
                connection.commit()

    except Exception as e:
        connection.rollback()
        print("Error executing SQL query:", str(e)), 500


    global fp_dicts
    global token_fppayload

    if username not in fp_dicts:
        fp_dicts[username] = {
            'token_fppayload': {
                'token': '',
                'hashed_token': '',
                'expiration' : '',
                'email' : '',
            }
        }

    token_fppayload = fp_dicts[username]['token_fppayload']
    print("New Dict:", fp_dicts)


    expiration_time = datetime.utcnow() + timedelta(minutes=15)
    expiration_timestamp = int(expiration_time.timestamp())

    verification_token = secrets.token_urlsafe(32)
    print("VERFICATION TOKEN:", verification_token)

    hashed_token = hashlib.sha256(verification_token.encode()).hexdigest()

    print("Checking THis hash:", hashed_token)

    token_fppayload['token'] = verification_token
    token_fppayload['hashed_token'] = hashed_token
    token_fppayload['expiration'] = expiration_timestamp
    token_fppayload['email'] = emailaddress
    encoded_username = base64.b64encode(username.encode()).decode()
    url_parameters = f"token={hashed_token}.{encoded_username}"
    print('Update DICTS', fp_dicts)
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = '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'

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    subject = "Email Verification"
    html_content = f"""
    <html>
        <head>
            <style>
                body {{
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }}
                h1 {{
                    color: #333333;
                }}
                p {{
                    color: #666666;
                }}
                a {{
                    display: inline-block;
                    padding: 10px 20px;
                    margin-top: 20px;
                    background-color: #3498db;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 5px;
                }}
                a:hover {{
                    background-color: #2980b9;
                }}
            </style>
        </head>
        <body>
            <h1>Reset Your Password</h1>
            <p>Please Click On the Button below to Validate your Email Address and change your password.</p>
            <a href="http://localhost:3000/resetpassword?{url_parameters}">Verify Email</a>
        </body>
    </html>
    """
    sender = {"name":"JTR Support","email":"jtrhelp123@gmail.com"}
    print(f"Recipient's email address: {emailaddress}")
    to = [{'email': emailaddress}]
    cc = None
    bcc =None
    reply_to = None
    headers = {"Some-Custom-Name":"unique-id-1234"}
    params = {"parameter":"My param value","subject":"New Subject"}
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(to=to, bcc=bcc, cc=cc, reply_to=reply_to, headers=headers, html_content=html_content, sender=sender, subject=subject)

    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        pprint(api_response)
        return jsonify({'message': 'Email verification sent successfully'})
    except ApiException as e:
        print("Exception when calling SMTPApi->send_transac_email: %s\n" % e)
        return jsonify({'error': 'Failed to send email verification'})
    
def is_valid_tokenfp(hashed_token, username):
    print("trying is_valid_tokenfp")
    print("V1:", fp_dicts)
    print('V2:', fp_dicts[username])
    print('V3:', fp_dicts[username]['token_fppayload'])
    token = fp_dicts[username]['token_fppayload']['token']
    print("It's not about the journey:", token)
    expiration_timestamp = da_dicts[username]['token_fppayload']['expiration']

    # Validate the expiration
    current_timestamp = int(datetime.utcnow().timestamp())
    if current_timestamp > expiration_timestamp:
        return False

    # Validate the hashed token
    hash_object = hashlib.sha256(f"{token}".encode()).hexdigest()
    print('but the friends we made along the way:', hash_object)
    if hashed_token == hash_object:
        print("MET")
        return True
    
    print("NYET")
    return False

def encrypt_emailfp(email):
    cipher = AES.new(SECRET_KEYFP, AES.MODE_CBC, IVFP)
    print("e1")
    print("ENCRYPTION KEY1:", SECRET_KEYFP)
    print("Encryption IV:", IVFP)
    print("e2")
    padded_email = pad(email.encode(), AES.block_size)
    print("e3")
    encrypted_email = cipher.encrypt(padded_email)
    print("e4")
    print("WhaT  THE:", b64encode(IVFP + encrypted_email).decode())
    return b64encode(IVFP + encrypted_email).decode()

def decrypt_emailfp(encrypted_email):
    try:
        print("checking email:", encrypted_email)
        encrypted_data = b64decode(encrypted_email.encode())
        print("d1", encrypted_data)
        iv = encrypted_data[:16]
        print("d2", iv)
        print("decryption KEY1:", SECRET_KEYFP)
        cipher = AES.new(SECRET_KEYFP, AES.MODE_CBC, iv)
        print("d3", cipher)

        decrypted_data = unpad(cipher.decrypt(encrypted_data[16:]), AES.block_size)
        print("d4")
        print("CHauihbdfis:", decrypted_data.decode())
        return decrypted_data.decode()
    except Exception as e:
        print("Decryption error:", str(e))
        raise

    
@app.route('/verify_reset_password', methods=['POST'])
def reset_password():
    try:
        # Get the token from the request body
        data = request.json
        token = data.get('token', '')
        username = data.get('username', '')
        username = base64.b64decode(username.encode()).decode()
        print("Username", username)
        print("POWER OF FRIENDSHIP:", token)

        # Assuming you have a function is_valid_token for token validation
        if is_valid_tokenfp(token, username):  # Provide token_evpayload as the second argument
            print("CHECKED")
            print('OMG:', token_fppayload)
            
            if username in fp_dicts:
                username = username
                print("ASNI Username:", username)
                email = fp_dicts[username]['token_fppayload']['email']
                print("Email:",email)
                encrypted_email = encrypt_emailfp(email)
                print("What data type:", type(encrypted_email))
                print("What data :", encrypted_email)
                username = base64.b64encode(username.encode()).decode()


                # Assuming you have a function pool.connection() for database connection
                

                return jsonify({'Validation': 'success', 'encrypted_email': encrypted_email, 'encoded': username})

        else:
            # Return error response
            print("Id aint here broski")
            return jsonify({'Validation': 'failed'})

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'activation_status': 'error'})

# Make sure to include this return statement for cases where the function does not enter the 'if' block
    return jsonify({'activation_status': 'error'})

@app.route('/a_reset_password', methods=['POST'])
def a_reset_password():
    try:
        data = request.get_json()
        print("resetdata:", data)

        if 'newPassword' not in data :
            return jsonify({'error': 'Missing parameters'}), 400

        new_password = data['newPassword']

        username = data['encodedu']
        
        email = base64.b64decode(username.encode()).decode()
        print('decode:', username)


        try:
            # Proceed with the database update for username only
            sql = "UPDATE user_account SET password = %s  WHERE username = %s"
            connection = pool.connection()

            with connection.cursor() as cursor:
                cursor.execute(sql, (new_password, email))
            connection.commit()

            return jsonify({'message': 'Password updated successfully'})

        except Exception as e:
            connection.rollback()
            return jsonify({'error': str(e)}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500


#End of forget password email code
    
#Start of Disable 2fa Email code
    
token_dtfapayload = {
    'token': '',
    'hashed_token': '',
    'expiration': 0,
    'email': ''
}

@app.route('/email_disabletfa', methods=['POST'])
def email_disabletfa():
    data = request.get_json()
    print(f"Received JSON data: {data}")
    emailaddress = data.get('email','')
    try:
        connection = pool.connection()
        with connection.cursor() as cursor:
            sql = "SELECT username FROM user_account WHERE email_address = %s"
            cursor.execute(sql, (emailaddress,))
            result = cursor.fetchone()  # Fetch one row

            if result:
                username = result[0]
            else:
                username = None

        connection.commit()

    except Exception as e:
            connection.rollback()
            print("Error executing SQL query:", str(e))
            return "Error executing SQL query", 500

    expiration_time = datetime.utcnow() + timedelta(minutes=15)
    expiration_timestamp = int(expiration_time.timestamp())

    global dtfa_dicts
    global token_dtfapayload

    print("Checking username before check:", username)
    if username not in dtfa_dicts:
        dtfa_dicts[username] = {
            'token_dtfapayload': {
                'token': '',
                'hashed_token': '',
                'expiration' : '',
                'email' : '',
            }
        }

    token_dtfapayload = dtfa_dicts[username]['token_dtfapayload']
    print("New Dict:", dtfa_dicts)

    verification_token = secrets.token_urlsafe(32)
    print("VERFICATION TOKEN:", verification_token)

    hashed_token = hashlib.sha256(verification_token.encode()).hexdigest()

    print("Checking THis hash:", hashed_token)

    token_dtfapayload['token'] = verification_token
    token_dtfapayload['hashed_token'] = hashed_token
    token_dtfapayload['expiration'] = expiration_timestamp
    token_dtfapayload['email'] = emailaddress
    encoded_username = base64.b64encode(username.encode()).decode()
    url_parameters = f"token={hashed_token}.{encoded_username}"
    print('Update DICTS', dtfa_dicts)
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = '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'

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    subject = "Email Verification"
    html_content = f"""
    <html>
        <head>
            <style>
                body {{
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }}
                h1 {{
                    color: #333333;
                }}
                p {{
                    color: #666666;
                }}
                a {{
                    display: inline-block;
                    padding: 10px 20px;
                    margin-top: 20px;
                    background-color: #3498db;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 5px;
                }}
                a:hover {{
                    background-color: #2980b9;
                }}
            </style>
        </head>
        <body>
            <h1>Disable Your 2 Factor Authorization</h1>
            <p>Please Click On the Button below to Disable your 2 Factor Authorization.</p>
            <a href="http://localhost:3000/disabletfa?{url_parameters}">Verify Email</a>
        </body>
    </html>
    """
    sender = {"name":"JTR Support","email":"jtrhelp123@gmail.com"}
    print(f"Recipient's email address: {emailaddress}")
    to = [{'email': emailaddress}]
    cc = None
    bcc =None
    reply_to = None
    headers = {"Some-Custom-Name":"unique-id-1234"}
    params = {"parameter":"My param value","subject":"New Subject"}
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(to=to, bcc=bcc, cc=cc, reply_to=reply_to, headers=headers, html_content=html_content, sender=sender, subject=subject)

    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        pprint(api_response)
        return jsonify({'message': 'Email sent successfully'})
    except ApiException as e:
        print("Exception when calling SMTPApi->send_transac_email: %s\n" % e)
        return jsonify({'error': 'Failed to send email'})
    
def is_valid_tokendtfa(hashed_token, username):
    print('Trying is_valid_tokendtfa ')
    print("V1:", dtfa_dicts)
    print('V2:', dtfa_dicts[username])
    print('V3:', dtfa_dicts[username]['token_dtfapayload'])
    token = dtfa_dicts[username]['token_dtfapayload']['token']
    print("It's not about the journey:", token)
    expiration_timestamp = token_dtfapayload['expiration']

    # Validate the expiration
    current_timestamp = int(datetime.utcnow().timestamp())
    if current_timestamp > int(expiration_timestamp):
        return False

    # Validate the hashed token
    hash_object = hashlib.sha256(f"{token}".encode()).hexdigest()
    print('but the friends we made along the way:', hash_object)
    if hashed_token == hash_object:
        print("MET")
        return True
    
    print("NYET")
    return False

@app.route('/verify_disable_tfa', methods=['POST'])
def disable_tfa():
    try:
        # Get the token from the request body
        data = request.json
        token = data.get('token', '')
        username = data.get('username', '')
        username = base64.b64decode(username.encode()).decode()
        print("Username", username)
        print('Type iF username:', type(username))
        print("POWER OF FRIENDSHIP:", token)

        # Assuming you have a function is_valid_token for token validation
        if is_valid_tokendtfa(token, username):  # Provide token_evpayload as the second argument
            print("CHECKED")
            print('OMG:', token_dtfapayload)
            
            if username in dtfa_dicts:
                username = username

                try:
            # Proceed with the database update for username only
                    sql = "UPDATE user_account SET is_2fa_enabled = 0, tfa_secret = NULL  WHERE username = %s"
                    connection = pool.connection()

                    with connection.cursor() as cursor:
                        cursor.execute(sql, (username))
                    connection.commit()


                except Exception as e:
                        connection.rollback()
                        return jsonify({'error': str(e)}), 500
    

            return jsonify({'Validation': 'success'})

        else:
            # Return error response
            print("Id aint here broski")
            return jsonify({'Validation': 'failed'})

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'activation_status': 'error'})

#End of Disable 2fa Email code
    
#start of delete account email code
    
token_dapayload = {
    'token': '',
    'hashed_token': '',
    'expiration': 0,
    'email': ''
}

@app.route('/email_deletea', methods=['POST'])
def email_deletea():
    authorization_header = request.headers.get('Authorization')
    print('Auth TOken', authorization_header)

    if authorization_header is None:
        print('Not Valid')
        return "Token is Invalid"
    
    isValid = check_token_validity(authorization_header)
    print('isValid?', isValid)
    
    if not isValid:
        print('Invalid Token.')
        return "Invalid Token."
    else:
        print('Valid Token')

    data = request.get_json()
    print(f"Received JSON data: {data}")
    emailaddress = data.get('email','')
    id = getAccountIdFromCookie(authorization_header)
    email_from_cookie = getEmailAddressById(id, authorization_header)

    if emailaddress != email_from_cookie:
        return jsonify({'error': 'Access forbidden'}), 401
    
    username = data.get('username', '')

    expiration_time = datetime.utcnow() + timedelta(minutes=15)
    expiration_timestamp = int(expiration_time.timestamp())

    global da_dicts
    global token_dapayloadcheck

    if username not in da_dicts:
        da_dicts[username] = {
            'token_dapayload': {
                'token': '',
                'hashed_token': '',
                'expiration' : '',
            }
        }

    token_dapayload = da_dicts[username]['token_dapayload']
    print("New Dict:", da_dicts)

    verification_token = secrets.token_urlsafe(32)
    print("VERFICATION TOKEN:", verification_token)

    hashed_token = hashlib.sha256(verification_token.encode()).hexdigest()

    print("Checking THis hash:", hashed_token)

    token_dapayload['token'] = verification_token
    token_dapayload['hashed_token'] = hashed_token
    token_dapayload['expiration'] = expiration_timestamp
    encoded_username = base64.b64encode(username.encode()).decode()
    url_parameters = f"token={hashed_token}.{encoded_username}"
    print("Update dadict", da_dicts)
    # token_dapayload['email'] = emailaddress
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = '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'

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    subject = "Email Verification"
    html_content = f"""
    <html>
        <head>
            <style>
                body {{
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }}
                h1 {{
                    color: #333333;
                }}
                p {{
                    color: #666666;
                }}
                a {{
                    display: inline-block;
                    padding: 10px 20px;
                    margin-top: 20px;
                    background-color: #3498db;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 5px;
                }}
                a:hover {{
                    background-color: #2980b9;
                }}
            </style>
        </head>
        <body>
            <h1>Delete Your Account</h1>
            <p>Please Click On the Button below to Delete your Account.</p>
            <a href="http://localhost:3000/deleteaccount?{url_parameters}">Delete Account</a>
        </body>
    </html>
    """
    sender = {"name":"JTR Support","email":"jtrhelp123@gmail.com"}
    print(f"Recipient's email address: {emailaddress}")
    to = [{'email': emailaddress}]
    cc = None
    bcc =None
    reply_to = None
    headers = {"Some-Custom-Name":"unique-id-1234"}
    params = {"parameter":"My param value","subject":"New Subject"}
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(to=to, bcc=bcc, cc=cc, reply_to=reply_to, headers=headers, html_content=html_content, sender=sender, subject=subject)

    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        pprint(api_response)
        return jsonify({'message': 'Email sent successfully'})
    except ApiException as e:
        print("Exception when calling SMTPApi->send_transac_email: %s\n" % e)
        return jsonify({'error': 'Failed to send email'})
    
def is_valid_tokenda(hashed_token, username):
    print('is tryin is_valid_tokenda ')
    print("V1:", da_dicts)
    print('V2:', da_dicts[username])
    print('V3:', da_dicts[username]['token_dapayload'])
    token = da_dicts[username]['token_dapayload']['token']
    print("It's not about the journey:", token)
    expiration_timestamp = da_dicts[username]['token_dapayload']['expiration']
    print('expiration TimeStamp:', expiration_timestamp)

    # Validate the expiration
    current_timestamp = int(datetime.utcnow().timestamp())
    if current_timestamp > expiration_timestamp:
        print('Currrent Time Stamp:', current_timestamp)
        return False

    # Validate the hashed token
    hash_object = hashlib.sha256(f"{token}".encode()).hexdigest()
    print('but the friends we made along the way:', hash_object)
    if hashed_token == hash_object:
        print("MET")
        return True
    
    print("NYET")
    return False

@app.route('/verify_delete_account', methods=['POST'])
def delete_account():
    try:
        # Get the token from the request body
        data = request.json
        token = data.get('token', '')
        username = data.get('username','')
        username = base64.b64decode(username.encode()).decode()
        print('Username:', username)
        print("POWER OF FRIENDSHIP:", token)

        # Assuming you have a function is_valid_token for token validation
        if is_valid_tokenda(token, username):  # Provide token_evpayload as the second argument
            print("CHECKED")
            print('OMG:', token_dapayload)
            
            if username in da_dicts:
                print('Success')
                print('UserName:', username)

                try:
            # Proceed with the database update for username only
                    sql = "DELETE FROM user_account WHERE username = %s"
                    connection = pool.connection()

                    with connection.cursor() as cursor:
                        cursor.execute(sql, (username))
                    connection.commit()

                    return jsonify({'message': 'Account Deleted successfully'})

                except Exception as e:
                        connection.rollback()
                        return jsonify({'error': str(e)}), 500
    

            return jsonify({'Validation': 'success'})

        else:
            # Return error response
            print("Id aint here broski")
            return jsonify({'Validation': 'failed'})

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'activation_status': 'error'})




if __name__ == '__main__':
    # Run the scheduler in a separate thread
    scheduler_thread = threading.Thread(target=run_scheduler)
    scheduler_thread.start()

    app.run(debug=True, port=5000, use_reloader=False)