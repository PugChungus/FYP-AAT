from __future__ import print_function
from flask import Flask, render_template, request, jsonify, Response
from werkzeug.utils import secure_filename
from flask_cors import cross_origin
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
from base64 import b64encode, b64decode
from datetime import datetime, timezone
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
from sib_api_v3_sdk.rest import ApiException
from pprint import pprint
import requests
from datetime import datetime, timedelta

jwt_token = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJlbmNyeXB0ZWRVc2VyRGF0YSI6Ijk4NUNkVTdGSUhuMHk3eWNQUHNWOXVxS2FQWGYvajJLWWYrV0VWTGNzMlI3a0l2S2w0Z3c1Zjdud3hiL1IzNkhKOURWZSttOXNBelg0dzJONGw5VnFBPT0iLCJpYXQiOjE3MDYzNjQyMDMsImV4cCI6MTcwNjM2NDI2M30.e59QrtZI658OtrbDr3eaK2Uqu_29jyQHbfxUFIpFXojLT4WqBdwQ6unY0eQs2Ynkb9vPv_sr3Vj-mgl7xeRjbg'
secretJwtKey = 'e24342ea5066e20c29822e6ddb06aa87b1761587a345bea0ecba77d8eb316e9b'

app = Flask(__name__)

@app.route('/check_token')
def check_token():
    try:
        decoded_token = jwt.decode(jwt_token, secretJwtKey, algorithms=["HS512"])
        print(decoded_token['exp'])

        # Check if the token is expired
        current_timestamp = int(datetime.utcnow().replace(tzinfo=timezone.utc).timestamp())
        print(current_timestamp)
        if decoded_token['exp'] < current_timestamp:
            print("Token has expired.")
            return False, 500

        print("Token Verified. Please Proceed.")
        return True, 200
    except Exception as e:
        # Handle other unexpected errors
        print({'error': str(e)})
        return False, 500

if __name__ == '__main__':
    app.run(debug=True)
