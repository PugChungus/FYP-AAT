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
    try:
        
        key = get_random_bytes(32)  # 32 bytes (256 bits) AES-256
        nonce = get_random_bytes(12) # GCM is most commonly used with 96-bit (12-byte) nonces, which is also the length recommended by NIST SP 800-38D.

        formatted_size = format_size(os.path.getsize(infile))
        header = f'{format_date()} {formatted_size}' #header doesnt need to be secret
        header_bytes = header.encode('utf-8') #convert to bytes obj

        filename = os.path.basename(infile)
        file_name, file_extension = os.path.splitext(filename)
        file_extension_str = file_extension.encode('utf-8')
        file_extension_padded = pad(file_extension_str, 16)

        with open(infile, 'rb') as infile_object:
            file_data = infile_object.read()
            file_data = file_extension_padded + file_data

        aes_gcm = AES.new(key, AES.MODE_GCM, nonce=nonce)
        aes_gcm.update(header_bytes)
        ciphertext, tag = aes_gcm.encrypt_and_digest(file_data)

        header_bytes_padded = pad(header_bytes, 48)
        ciphertext_padded = pad(ciphertext, 16)
        concat = header_bytes_padded + nonce + ciphertext_padded + tag
        # Write the encrypted data to the output file
        with open(outfile, 'wb') as outfile_object:
            outfile_object.write(concat)

        # Write the encryption key to the key file
        with open(keyfile, 'wb') as keyfile_object:
            keyfile_object.write(key)

        print(key, 'key')
        print(header_bytes, 'header')
        print(nonce, 'nonce')
        print(ciphertext, 'ciphertext')
        print(tag , 'tag')

    except Exception as e:
        print("An error occurred during encryption:", str(e))