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
import pyotp
import qrcode

app = Flask(__name__)
CORS(app)  

encrypted_data_dict = {}
decrypted_data_dict = {}

# Connect to the MySQL database

db = pymysql.connect(host = 'localhost', port = 3306, user = 'root', password = 'password', database = 'major_project_db')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg'}  # Define the allowed image file extensions

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
        sql = "UPDATE user_account SET username = %s, profile_picture = %s WHERE email_address = %s"
        with db.cursor() as cursor:
            cursor.execute(sql, (username, file_bytes, email))
        db.commit()
        return jsonify({'message': 'File uploaded successfully'})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)})

@app.route('/aes_keygen', methods=['POST'])
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

def get_account_id(email):
    # Assuming you have a function to retrieve account_id based on email
    with db.cursor() as cursor:
        sql = "SELECT account_id FROM user_account WHERE email_address = %s;"
        cursor.execute(sql, (email,))
        result = cursor.fetchone()
        return result[0] if result else None
    
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
        with db.cursor() as cursor:
            sql = "UPDATE user_account SET tfa_secret = %s WHERE email_address = %s"
            cursor.execute(sql, (secret, email))
        db.commit()
    except Exception as e:
        db.rollback()
        print("Error storing secret: ", str(e))

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
        hex = request.form['hex']
        key = bytes.fromhex(hex)
        
        # Create a BytesIO object to store the ZIP file in memory
        for uploaded_file in uploaded_files:
            nonce = get_random_bytes(12)

            file_size_bytes = uploaded_file.content_length
            formatted_size = format_size(file_size_bytes)
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

            encrypted_data_dict[new_file_name] = concat

        return "End of Encryption", 200

    except Exception as e:
        print("Error processing Files:", str(e))
        return {"isValid": False, "error": str(e)}

@app.route('/decrypt', methods=['POST'])
def decrypt_files():
    try:
        uploaded_files = request.files.getlist('files')
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
                    decrypted_data_dict[join_file_name] = decrypted_zip_data.getvalue()

                    for keys, value in decrypted_data_dict.items():
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

                decrypted_data_dict[file_with_original_extension] = file_data

                file_extension = original_extension.replace('.', '')

                return jsonify(decrypted_extension=file_extension)

    except Exception as e:
        print("Error processing Files:", str(e))
        return {"isValid": False, "error": str(e)}
    
@app.route('/display_history', methods=['POST'])
def display_history():
    try:
        email = request.form['email']

        sql = "SELECT history.time, history.file_name, history.file_size, history.type, history.key_name " \
            "FROM history " \
            "INNER JOIN user_account ON history.account_id = user_account.account_id " \
            "WHERE user_account.email_address = %s;"

        with db.cursor() as cursor:
            cursor.execute(sql, (email))
            rows = cursor.fetchall()
            print(rows)
            
        column_names = [desc[0] for desc in cursor.description]
        result = [dict(zip(column_names, row)) for row in rows]

        return jsonify(result)

    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)})

@app.route('/add_to_encryption_history', methods=['POST'])
def encrypt_history():
    try:
        uploaded_file = request.files['files']
        file_name = uploaded_file.filename
        file_data = uploaded_file.read()
        file_size = format_size(len(file_data))
        email = request.form['email']  # Use request.form for form data
        # Assuming you have a function to retrieve account_id based on email
        account_id = get_account_id(email)
        key_name = request.form['key_name']
        type_of_encryption = request.form['type']  # Use request.form for form data

        # Proceed with the database update for username only
        sql = "INSERT INTO history (time, file_name, file_size, account_id, type, key_name) VALUES (%s, %s, %s, %s, %s, %s);"
        
        with db.cursor() as cursor:
            cursor.execute(sql, (datetime.now(), file_name, file_size, account_id, type_of_encryption, key_name))
        
        db.commit()
        
        return jsonify({'message': 'Data inserted successfully'})
    
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)})

@app.route('/add_to_decryption_history', methods=['POST'])
def decrypt_history():
    try:
        uploaded_file = request.files['files']
        file_name = uploaded_file.filename
        file_data = uploaded_file.read()
        file_size = format_size(len(file_data))
        email = request.form['email']  # Use request.form for form data
        # Assuming you have a function to retrieve account_id based on email
        account_id = get_account_id(email)
        key_name = request.form['key_name']
        type_of_encryption = request.form['type']  # Use request.form for form data

        # Proceed with the database update for username only
        sql = "INSERT INTO history (time, file_name, file_size, account_id, type, key_name) VALUES (%s, %s, %s, %s, %s, %s);"
        
        with db.cursor() as cursor:
            cursor.execute(sql, (datetime.now(), file_name, file_size, account_id, type_of_encryption, key_name))
        
        db.commit()
        
        return jsonify({'message': 'Data inserted successfully'})
    
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)})

@app.route('/download_single_encrypted_file/<filename>', methods=['GET'])
def download_single_encrypted_file(filename):
    print(filename, file=sys.stderr)
    for keys, value in encrypted_data_dict.items():
        print(keys, file=sys.stderr)
    encrypted_data = encrypted_data_dict.get(filename, None)
    # print(encrypted_data, file=sys.stderr)
    if encrypted_data is None:
        return 'File not found', 404
    WideFileName = filename.encode("utf-8").decode("latin-1")
    # Set the Content-Disposition header to specify the filename
    response = Response(encrypted_data, content_type='application/octet-stream')
    response.headers['Content-Disposition'] = f'attachment; filename="{WideFileName}"'
    return response

@app.route('/download_zip/<filename>', methods=['GET'])
def download_zip(filename):
    print(filename, file=sys.stderr)
    encrypted_zip_data = BytesIO()

    with zipfile.ZipFile(encrypted_zip_data, 'w', zipfile.ZIP_STORED, allowZip64=True) as zipf:
        for encrypted_filename, encrypted_data in encrypted_data_dict.items():
            # Add the encrypted data to the ZIP archive with the encrypted filename
            print(encrypted_filename, file=sys.stderr)
            zipf.writestr(encrypted_filename, encrypted_data)

    zip_filename = f'encrypted_zip.zip'

    encrypted_zip_data.seek(0)
    encrypted_data_dict[zip_filename] = encrypted_zip_data.getvalue()
    encrypted_zip_data.seek(0)
    encrypted_zip_data.truncate(0)

    for keys, value in encrypted_data_dict.items():
        print(keys, file=sys.stderr)
    encrypted_data = encrypted_data_dict.get(filename, None)

    if encrypted_data is None:
        return 'File not found', 404

    WideFileName = filename.encode("utf-8").decode("latin-1")
    # Set the Content-Disposition header to specify the filename
    response = Response(encrypted_data, content_type='application/octet-stream')
    response.headers['Content-Disposition'] = f'attachment; filename="{WideFileName}"'

    return response

@app.route('/download_single_decrypted_file/<filename>', methods=['GET'])
def download_single_decrypted_file(filename):
    print(filename, 'file')
    for keys, value in decrypted_data_dict.items():
        print(keys, 'key')
    decrypted_data = decrypted_data_dict.get(filename, None)
    # print(encrypted_data, file=sys.stderr)
    if decrypted_data is None:
        return 'File not found', 404
    WideFileName = filename.encode("utf-8").decode("latin-1")
    # Set the Content-Disposition header to specify the filename
    response = Response(decrypted_data, content_type='application/octet-stream')
    response.headers['Content-Disposition'] = f'attachment; filename="{WideFileName}"'
    return response

@app.route('/download_decrypted_zip/<filename>', methods=['GET'])
def download_decrypted_zip(filename):
    print(filename, file=sys.stderr)
    for keys, value in decrypted_data_dict.items():
        print(keys, file=sys.stderr)
    decrypted_zip_data = BytesIO()

    with zipfile.ZipFile(decrypted_zip_data, 'w', zipfile.ZIP_STORED, allowZip64=True) as zipf:
        for decrypted_filename, decrypted_data in decrypted_data_dict.items():
            # Add the encrypted data to the ZIP archive with the encrypted filename
            print(decrypted_filename, file=sys.stderr)
            zipf.writestr(decrypted_filename, decrypted_data)

    zip_filename = f'unencrypted.zip'

    decrypted_zip_data.seek(0)
    decrypted_data_dict[zip_filename] = decrypted_zip_data.getvalue()
    decrypted_zip_data.seek(0)
    decrypted_zip_data.truncate(0)

    decrypted_data = decrypted_data_dict.get(filename, None)

    if decrypted_data is None:
        return 'File not found', 404

    WideFileName = filename.encode("utf-8").decode("latin-1")
    # Set the Content-Disposition header to specify the filename
    response = Response(decrypted_data, content_type='application/octet-stream')
    response.headers['Content-Disposition'] = f'attachment; filename="{WideFileName}"'

    return response

@app.route('/clear_encrypted_folder', methods=['GET'])
def clear_encrypted_folder():
    encrypted_data_dict.clear()
    return 'Encrypted folder cleared', 200

@app.route('/clear_decrypted_folder', methods=['GET'])
def clear_decrypted_folder():
    decrypted_data_dict.clear()
    return 'Decrypted folder cleared', 200

user_secrets = {}

@app.route('/generate_2fa_qr_code', methods=['POST'])
def generate_2fa_qr_code():
    try:
        email = request.form.get('email')

        # Generate a new secret for the user
        secret = pyotp.random_base32()

        # Store the secret securely
        user_secrets[email] = secret

        totp = pyotp.TOTP(secret)
        otp = totp.now()
        qr_code_url = totp.provisioning_uri(email, issuer_name="JTR Encryption")

        return jsonify({'qr_code_url': qr_code_url, 'otp': otp, 'secret': secret})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/verify_2fa', methods=['POST'])
def verify_2fa():
    try:
        email = request.form.get('email')
        user_input_otp = request.form.get('otp')

        # Retrieve the secret associated with the user
        secret = user_secrets.get(email)

        if secret is None:
            raise ValueError('Secret key not found for the specified email.')

        # Verify the OTP
        totp = pyotp.TOTP(secret)
        is_valid = totp.verify(user_input_otp)

        if is_valid:
            return jsonify({'message': 'OTP is valid'})
        else:
            return jsonify({'error': 'Invalid OTP'})
    except Exception as e:
        return jsonify({'error': str(e)})                                   

if __name__ == '__main__':
    app.run(debug=True,
    port=5000)
