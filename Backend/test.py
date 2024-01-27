from __future__ import print_function
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

jwt_token = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJlbmNyeXB0ZWRVc2VyRGF0YSI6ImxEZXd5eFF1SGh0MWNnSm4rQjg0NlRQRGtHbXp6aGpXYTk1NkRLY3lsRFBBanpuMzM1VTNOOVBkV2E1L1lkVDgxaG5WdWJOeXVvaDM1QkdHV3JTOUtRPT0iLCJpYXQiOjE3MDYzMzQ5MTIsImV4cCI6MTcwNjMzODUxMn0.qBTSB9UdMASE3KgIFeix7H7yBVFtBnNkSpFVoaAreHnwbWOu7rT1V5HTV-VE2gkEsGv8__8aKF_3ZSIdeUceNQ'
secretJwtKey = 'd0b4e05b3095a905ca6df1679f0a92b369f1165a3bb56d5b6ee1b01a115444c4'

app = Flask(__name__)

@app.route('/check_token')
def check_token():
    try:
        # Decode the JWT token to check its validity
        jwt.decode(jwt_token, secretJwtKey, algorithms=["HS512"])

        print("Token Verified. Please Proceed.")
        return jsonify({'message': 'Token Verified. Please Proceed.'})
    except Exception as e:
        # Handle other unexpected errors
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
